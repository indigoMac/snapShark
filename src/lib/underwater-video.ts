const MAX_OUTPUT_EDGE = 1920;
const DEFAULT_OUTPUT_PIXELS = 1920 * 1080;

// Re-encoding an already-compressed clip at its source bitrate always loses,
// because the encoder has to spend bits reproducing the source's own artifacts.
const TRANSCODE_HEADROOM = 1.6;
const BITS_PER_PIXEL_PER_FRAME = 0.2;
const MAX_BITRATE = 24_000_000;
const MIN_BITRATE = 4_000_000;
const AUDIO_BITRATE = 128_000;

export const DEFAULT_FRAME_RATE = 30;
const MIN_FRAME_RATE = 12;
const MAX_FRAME_RATE = 60;

// Ordered best-first. Every browser supports VP8, so it has to sit last or it
// wins every negotiation despite being the weakest encoder of the set.
const VIDEO_ONLY_TYPES = [
  'video/mp4;codecs=avc1.640029',
  'video/mp4;codecs=avc1.4d0028',
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

const AUDIO_VIDEO_TYPES = [
  'video/mp4;codecs=avc1.640029,mp4a.40.2',
  'video/mp4;codecs=avc1.4d0028,mp4a.40.2',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function evenOutputSize(width: number, height: number): {
  width: number;
  height: number;
} {
  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(width, height, 1));
  return {
    width: Math.max(2, Math.round((width * scale) / 2) * 2),
    height: Math.max(2, Math.round((height * scale) / 2) * 2),
  };
}

export function clampVideoBitrate(
  fileSizeBytes: number,
  durationSec: number,
  outputPixels = DEFAULT_OUTPUT_PIXELS,
  frameRate = DEFAULT_FRAME_RATE
): number {
  const sourceBits = Math.max(
    0,
    (fileSizeBytes * 8) / Math.max(durationSec, 0.1) - AUDIO_BITRATE
  );
  const budget = outputPixels * frameRate * BITS_PER_PIXEL_PER_FRAME;
  const target = Math.max(sourceBits * TRANSCODE_HEADROOM, budget * 0.5);
  return Math.round(
    Math.max(MIN_BITRATE, Math.min(MAX_BITRATE, budget, target))
  );
}

export function recorderContainerType(mimeType: string): 'video/mp4' | 'video/webm' {
  return mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
}

export function scaleColorMatrix(matrix: number[], intensity: number): number[] {
  return matrix.map((value, index) => {
    if (index % 5 === 4) {
      return value * intensity;
    }
    const identityValue = index % 6 === 0 ? 1 : 0;
    return identityValue + (value - identityValue) * intensity;
  });
}

export function applyColorMatrix(
  imageData: ImageData,
  scaledMatrix: number[]
): ImageData {
  const { data, width, height } = imageData;
  const next = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    next.data[i] = Math.max(
      0,
      Math.min(
        255,
        scaledMatrix[0] * r + scaledMatrix[1] * g + scaledMatrix[2] * b + scaledMatrix[4] * 255
      )
    );
    next.data[i + 1] = Math.max(
      0,
      Math.min(
        255,
        scaledMatrix[5] * r + scaledMatrix[6] * g + scaledMatrix[7] * b + scaledMatrix[9] * 255
      )
    );
    next.data[i + 2] = Math.max(
      0,
      Math.min(
        255,
        scaledMatrix[10] * r +
          scaledMatrix[11] * g +
          scaledMatrix[12] * b +
          scaledMatrix[14] * 255
      )
    );
    next.data[i + 3] = data[i + 3];
  }

  return next;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = vec2((a_position.x + 1.0) * 0.5, 1.0 - (a_position.y + 1.0) * 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;
uniform sampler2D u_texture;
uniform mat3 u_matrix;
uniform vec3 u_offset;
uniform vec2 u_tap;
varying vec2 v_uv;

vec3 sampleSource(vec2 uv) {
  if (u_tap.x <= 0.0 && u_tap.y <= 0.0) {
    return texture2D(u_texture, uv).rgb;
  }
  return 0.25 * (
    texture2D(u_texture, uv + vec2(-u_tap.x, -u_tap.y)).rgb +
    texture2D(u_texture, uv + vec2(u_tap.x, -u_tap.y)).rgb +
    texture2D(u_texture, uv + vec2(-u_tap.x, u_tap.y)).rgb +
    texture2D(u_texture, uv + vec2(u_tap.x, u_tap.y)).rgb
  );
}

void main() {
  vec3 corrected = u_matrix * sampleSource(v_uv) + u_offset;
  gl_FragColor = vec4(clamp(corrected, 0.0, 1.0), 1.0);
}
`;

export type ColorMatrixRenderer = {
  setMatrix: (scaledMatrix: number[]) => void;
  render: (source: TexImageSource) => void;
  dispose: () => void;
};

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Could not compile WebGL shader: ${log ?? 'unknown error'}`);
  }
  return shader;
}

/**
 * Applies the colour matrix on the GPU so a frame costs well under a
 * millisecond. The CPU version cannot keep pace with real-time playback at
 * 1080p, which leaves the recorder capturing stale frames.
 */
export function createColorMatrixRenderer(
  canvas: HTMLCanvasElement,
  sourceWidth: number,
  sourceHeight: number
): ColorMatrixRenderer {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  }) as WebGLRenderingContext | null;

  if (!gl) {
    throw new Error(
      'Video colour-fix needs WebGL. Try the latest Chrome, Firefox, or Safari.'
    );
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SOURCE
  );
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create WebGL program');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error(`Could not link WebGL program: ${log ?? 'unknown error'}`);
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
  const offsetLocation = gl.getUniformLocation(program, 'u_offset');
  const tapLocation = gl.getUniformLocation(program, 'u_tap');

  // A single bilinear tap aliases when minifying, so widen to a 2x2 box once
  // the downscale is steep enough to matter.
  const minifies =
    sourceWidth / Math.max(canvas.width, 1) > 1.2 ||
    sourceHeight / Math.max(canvas.height, 1) > 1.2;
  gl.uniform2f(
    tapLocation,
    minifies ? 0.25 / canvas.width : 0,
    minifies ? 0.25 / canvas.height : 0
  );
  gl.viewport(0, 0, canvas.width, canvas.height);

  return {
    setMatrix(scaledMatrix: number[]) {
      // GLSL mat3 is column-major; the matrix rows are r/g/b output channels.
      gl.uniformMatrix3fv(
        matrixLocation,
        false,
        new Float32Array([
          scaledMatrix[0],
          scaledMatrix[5],
          scaledMatrix[10],
          scaledMatrix[1],
          scaledMatrix[6],
          scaledMatrix[11],
          scaledMatrix[2],
          scaledMatrix[7],
          scaledMatrix[12],
        ])
      );
      gl.uniform3f(
        offsetLocation,
        scaledMatrix[4],
        scaledMatrix[9],
        scaledMatrix[14]
      );
    },
    render(source: TexImageSource) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.flush();
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

export function imageDataToJpegUrl(imageData: ImageData, quality = 0.85): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Could not get canvas context'));
  }
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create preview'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function waitForVideoData(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return;

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(
        new Error(
          'Could not read that video. Try an MP4 or WebM clip under 60 seconds.'
        )
      );
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'Could not read that video. Try an MP4 or WebM clip under 60 seconds.'
        )
      );
    }, 8000);
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      window.clearTimeout(timeoutId);
    };
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onError);
  });
}

export function waitForVideoTime(
  video: HTMLVideoElement,
  time: number
): Promise<void> {
  return new Promise((resolve) => {
    const target = Math.max(0, time);
    if (Math.abs(video.currentTime - target) < 0.0005 && video.readyState >= 2) {
      resolve();
      return;
    }

    const finish = () => {
      video.removeEventListener('seeked', finish);
      window.clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = window.setTimeout(finish, 1500);
    video.addEventListener('seeked', finish);
    video.currentTime = target;
  });
}

export function mountOffscreen(element: HTMLElement): void {
  element.style.position = 'fixed';
  element.style.left = '0';
  element.style.top = '0';
  element.style.opacity = '0';
  element.style.pointerEvents = 'none';
  element.style.zIndex = '-1';
  document.body.appendChild(element);
}

export function requestCanvasFrame(stream: MediaStream): void {
  const track = stream.getVideoTracks()[0] as
    | (MediaStreamTrack & { requestFrame?: () => void })
    | undefined;
  track?.requestFrame?.();
}

export async function waitOneFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Returns null when the container reports no usable duration, which some
 * recorders do for an otherwise valid clip. Callers must not read that as empty.
 */
export async function readBlobDuration(blob: Blob): Promise<number | null> {
  const url = URL.createObjectURL(blob);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = url;
    await waitForVideoData(video);
    const duration = video.duration;
    video.src = '';
    return Number.isFinite(duration) ? duration : null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ElementAudioCapture = {
  track: MediaStreamTrack;
  dispose: () => void;
};

type AudioContextConstructor = new () => AudioContext;

/**
 * Routes the element's audio into a MediaStream so the recorder can mux it.
 * The graph is deliberately not wired to the speakers, so nothing is audible
 * while the clip processes. Returns null when the browser has no Web Audio.
 */
export function captureElementAudio(
  video: HTMLVideoElement
): ElementAudioCapture | null {
  const AudioContextImpl = (window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext) as AudioContextConstructor | undefined;
  if (!AudioContextImpl) return null;

  const context = new AudioContextImpl();
  const source = context.createMediaElementSource(video);
  const destination = context.createMediaStreamDestination();
  source.connect(destination);

  const track = destination.stream.getAudioTracks()[0];
  if (!track) {
    source.disconnect();
    void context.close();
    return null;
  }

  // A MediaElementAudioSourceNode stays silent while the element is muted.
  video.muted = false;
  void context.resume();

  return {
    track,
    dispose: () => {
      video.muted = true;
      source.disconnect();
      track.stop();
      void context.close();
    },
  };
}

export type CanvasRecorderSession = {
  recorder: MediaRecorder;
  mimeType: string;
  stop: () => Promise<Blob>;
};

export type RecorderSettings = {
  videoBitsPerSecond: number;
  withAudio?: boolean;
};

export async function startCanvasRecorder(
  stream: MediaStream,
  settings: RecorderSettings
): Promise<CanvasRecorderSession> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Video colour-fix is not supported in this browser. Try the latest Chrome, Firefox, or Safari.'
    );
  }

  const preferred = settings.withAudio ? AUDIO_VIDEO_TYPES : VIDEO_ONLY_TYPES;
  const candidates = [
    ...preferred.filter((type) => MediaRecorder.isTypeSupported(type)),
    '',
  ];

  let lastError: unknown;
  for (const mimeType of candidates) {
    try {
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: settings.videoBitsPerSecond,
      };
      if (settings.withAudio) options.audioBitsPerSecond = AUDIO_BITRATE;
      if (mimeType) options.mimeType = mimeType;
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      const started = await waitForRecorderStart(recorder);
      if (started) {
        return {
          recorder,
          mimeType: recorder.mimeType || mimeType,
          stop: () => finalizeRecorder(recorder, chunks),
        };
      }
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Video encoding failed to start. Try a shorter 1080p MP4 or WebM clip.');
}

function waitForRecorderStart(recorder: MediaRecorder): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      recorder.removeEventListener('start', onStart);
      recorder.removeEventListener('error', onError);
      window.clearTimeout(timeoutId);
      resolve(ok);
    };
    const onStart = () => finish(true);
    const onError = () => finish(false);
    const timeoutId = window.setTimeout(() => {
      finish(recorder.state === 'recording');
    }, 2500);

    recorder.addEventListener('start', onStart);
    recorder.addEventListener('error', onError);
    try {
      // No timeslice: one blob on stop. Timeslice events were previously dropped.
      recorder.start();
    } catch {
      finish(false);
      return;
    }
    if (recorder.state === 'recording') {
      finish(true);
    }
  });
}

function finalizeRecorder(
  recorder: MediaRecorder,
  chunks: Blob[]
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = recorder.mimeType || 'video/webm';
    recorder.onerror = () => {
      reject(new Error('Video encoding failed. Try a shorter MP4 or WebM clip.'));
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    if (recorder.state === 'inactive') {
      resolve(new Blob(chunks, { type: mimeType }));
      return;
    }
    recorder.stop();
  });
}

type VideoFrameMetadata = {
  mediaTime: number;
  presentedFrames: number;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, metadata: VideoFrameMetadata) => void
  ) => number;
};

export function normalizeFrameRate(frameRate: number): number {
  if (!Number.isFinite(frameRate) || frameRate <= 0) return DEFAULT_FRAME_RATE;
  return Math.min(MAX_FRAME_RATE, Math.max(MIN_FRAME_RATE, Math.round(frameRate)));
}

/**
 * Measures the source frame rate from presented frames so the bitrate budget
 * and progress counter match the clip instead of assuming 30fps.
 * The video must already be playing.
 */
export function probeFrameRate(
  video: HTMLVideoElement,
  sampleMs = 400
): Promise<number> {
  const el = video as VideoWithFrameCallback;
  if (typeof el.requestVideoFrameCallback !== 'function') {
    return Promise.resolve(DEFAULT_FRAME_RATE);
  }

  return new Promise((resolve) => {
    let first: VideoFrameMetadata | null = null;
    let last: VideoFrameMetadata | null = null;
    let stopped = false;

    const onFrame = (_now: number, metadata: VideoFrameMetadata) => {
      if (stopped) return;
      if (!first) {
        first = metadata;
      } else {
        last = metadata;
      }
      el.requestVideoFrameCallback!(onFrame);
    };

    window.setTimeout(() => {
      stopped = true;
      if (!first || !last) {
        resolve(DEFAULT_FRAME_RATE);
        return;
      }
      const frames = last.presentedFrames - first.presentedFrames;
      const seconds = last.mediaTime - first.mediaTime;
      if (frames < 2 || seconds <= 0) {
        resolve(DEFAULT_FRAME_RATE);
        return;
      }
      resolve(normalizeFrameRate(frames / seconds));
    }, sampleMs);

    el.requestVideoFrameCallback(onFrame);
  });
}

export function attachFramePump(
  video: HTMLVideoElement,
  onFrame: () => void
): () => void {
  const el = video as VideoWithFrameCallback;
  let stopped = false;
  let raf = 0;

  const pump = () => {
    if (stopped) return;
    if (!video.paused && !video.ended) {
      onFrame();
    }
    if (stopped || video.ended) return;
    if (typeof el.requestVideoFrameCallback === 'function') {
      el.requestVideoFrameCallback(pump);
    } else {
      raf = window.requestAnimationFrame(pump);
    }
  };

  pump();

  return () => {
    stopped = true;
    window.cancelAnimationFrame(raf);
  };
}
