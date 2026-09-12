import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyColorMatrix,
  attachFramePump,
  captureElementAudio,
  createColorMatrixRenderer,
  imageDataToJpegUrl,
  mountOffscreen,
  probeFrameRate,
  readBlobDuration,
  requestCanvasFrame,
  startCanvasRecorder,
  waitForVideoData,
  waitForVideoTime,
  waitOneFrame,
} from '@/lib/underwater-video';

const IDENTITY_MATRIX = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

// jsdom omits ImageData unless the native canvas package is installed.
if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataShim {
    readonly data: Uint8ClampedArray;
    constructor(
      readonly width: number,
      readonly height: number
    ) {
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  (globalThis as Record<string, unknown>).ImageData = ImageDataShim;
}

/* -------------------------------------------------------------------------- */
/* WebGL fake                                                                  */
/* -------------------------------------------------------------------------- */

function createFakeGl() {
  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    TEXTURE_2D: 7,
    TEXTURE_WRAP_S: 8,
    TEXTURE_WRAP_T: 9,
    CLAMP_TO_EDGE: 10,
    TEXTURE_MIN_FILTER: 11,
    TEXTURE_MAG_FILTER: 12,
    LINEAR: 13,
    RGB: 14,
    UNSIGNED_BYTE: 15,
    FLOAT: 16,
    TRIANGLE_STRIP: 17,
    createShader: vi.fn(() => ({ shader: true })),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => 'shader log'),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({ program: true })),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => 'program log'),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({ buffer: true })),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    createTexture: vi.fn(() => ({ texture: true })),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    // Echo the uniform name back so assertions can identify the target.
    getUniformLocation: vi.fn((_program: unknown, name: string) => name),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniformMatrix3fv: vi.fn(),
    viewport: vi.fn(),
    texImage2D: vi.fn(),
    drawArrays: vi.fn(),
    flush: vi.fn(),
    deleteTexture: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
  };
}

type FakeGl = ReturnType<typeof createFakeGl>;

function stubWebGl(gl: FakeGl | null) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    ((type: string) => (type === 'webgl' ? gl : null)) as never
  );
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/* -------------------------------------------------------------------------- */
/* MediaRecorder fake                                                          */
/* -------------------------------------------------------------------------- */

class FakeMediaRecorder extends EventTarget {
  static supported: string[] = [];
  static constructed: Array<{ mimeType?: string; options: MediaRecorderOptions }> = [];
  static throwFor: string[] = [];

  static isTypeSupported(type: string) {
    return FakeMediaRecorder.supported.includes(type);
  }

  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(_stream: MediaStream, options: MediaRecorderOptions = {}) {
    super();
    if (options.mimeType && FakeMediaRecorder.throwFor.includes(options.mimeType)) {
      throw new Error(`unsupported: ${options.mimeType}`);
    }
    this.mimeType = options.mimeType ?? '';
    FakeMediaRecorder.constructed.push({ mimeType: options.mimeType, options });
  }

  start() {
    this.state = 'recording';
    this.dispatchEvent(new Event('start'));
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['encoded-video-payload']) });
    this.onstop?.();
  }
}

function useFakeRecorder(supported: string[], throwFor: string[] = []) {
  FakeMediaRecorder.supported = supported;
  FakeMediaRecorder.throwFor = throwFor;
  FakeMediaRecorder.constructed = [];
  (globalThis as Record<string, unknown>).MediaRecorder = FakeMediaRecorder;
}

const fakeStream = () =>
  ({ getVideoTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream;

/* -------------------------------------------------------------------------- */

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as Record<string, unknown>).MediaRecorder;
  delete (globalThis as Record<string, unknown>).AudioContext;
});

describe('createColorMatrixRenderer', () => {
  it('packs the colour matrix column-major for GLSL', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    const renderer = createColorMatrixRenderer(makeCanvas(640, 360), 640, 360);

    // Row-major channel rows: r=(1,2,3), g=(6,7,8), b=(11,12,13).
    renderer.setMatrix([
      1, 2, 3, 0, 0.5, 6, 7, 8, 0, 0.25, 11, 12, 13, 0, 0.125, 0, 0, 0, 1, 0,
    ]);

    const [location, transpose, values] = gl.uniformMatrix3fv.mock.calls[0];
    expect(location).toBe('u_matrix');
    expect(transpose).toBe(false);
    expect(Array.from(values as Float32Array)).toEqual([
      1, 6, 11, 2, 7, 12, 3, 8, 13,
    ]);
  });

  it('takes the per-channel offsets from the matrix translation column', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    const renderer = createColorMatrixRenderer(makeCanvas(640, 360), 640, 360);

    renderer.setMatrix([
      1, 2, 3, 0, 0.5, 6, 7, 8, 0, 0.25, 11, 12, 13, 0, 0.125, 0, 0, 0, 1, 0,
    ]);

    expect(gl.uniform3f).toHaveBeenCalledWith('u_offset', 0.5, 0.25, 0.125);
  });

  it('uses a single tap when the source is not being downscaled', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    createColorMatrixRenderer(makeCanvas(1920, 1080), 1920, 1080);

    expect(gl.uniform2f).toHaveBeenCalledWith('u_tap', 0, 0);
  });

  it('widens to a box tap when minifying, to avoid aliasing', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    createColorMatrixRenderer(makeCanvas(1920, 1080), 3840, 2160);

    expect(gl.uniform2f).toHaveBeenCalledWith('u_tap', 0.25 / 1920, 0.25 / 1080);
  });

  it('uploads the frame and draws on render', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    const renderer = createColorMatrixRenderer(makeCanvas(64, 64), 64, 64);
    const source = document.createElement('video');

    renderer.render(source);

    expect(gl.texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      source
    );
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
  });

  it('releases GPU resources on dispose', () => {
    const gl = createFakeGl();
    stubWebGl(gl);
    const renderer = createColorMatrixRenderer(makeCanvas(64, 64), 64, 64);

    renderer.dispose();

    expect(gl.deleteTexture).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
  });

  it('reports a usable message when WebGL is unavailable', () => {
    stubWebGl(null);

    expect(() => createColorMatrixRenderer(makeCanvas(64, 64), 64, 64)).toThrow(
      /WebGL/
    );
  });

  it('surfaces shader compile failures instead of rendering wrong colours', () => {
    const gl = createFakeGl();
    gl.getShaderParameter.mockReturnValue(false);
    stubWebGl(gl);

    expect(() => createColorMatrixRenderer(makeCanvas(64, 64), 64, 64)).toThrow(
      /Could not compile WebGL shader/
    );
  });

  it('surfaces program link failures', () => {
    const gl = createFakeGl();
    gl.getProgramParameter.mockReturnValue(false);
    stubWebGl(gl);

    expect(() => createColorMatrixRenderer(makeCanvas(64, 64), 64, 64)).toThrow(
      /Could not link WebGL program/
    );
  });
});

describe('startCanvasRecorder codec negotiation', () => {
  it('prefers H.264 over VP8 when both are available', async () => {
    useFakeRecorder([
      'video/mp4;codecs=avc1.640029',
      'video/webm;codecs=vp8',
      'video/webm',
    ]);

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
    });

    expect(session.mimeType).toBe('video/mp4;codecs=avc1.640029');
  });

  it('prefers VP9 over VP8 when MP4 is unavailable', async () => {
    useFakeRecorder(['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']);

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
    });

    expect(session.mimeType).toBe('video/webm;codecs=vp9');
  });

  it('falls back to VP8 only when nothing better is supported', async () => {
    useFakeRecorder(['video/webm;codecs=vp8']);

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
    });

    expect(session.mimeType).toBe('video/webm;codecs=vp8');
  });

  it('negotiates a muxed audio+video type when audio is present', async () => {
    useFakeRecorder([
      'video/mp4;codecs=avc1.640029',
      'video/mp4;codecs=avc1.640029,mp4a.40.2',
      'video/webm;codecs=vp9,opus',
    ]);

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
      withAudio: true,
    });

    expect(session.mimeType).toBe('video/mp4;codecs=avc1.640029,mp4a.40.2');
    expect(FakeMediaRecorder.constructed[0].options.audioBitsPerSecond).toBe(128_000);
  });

  it('omits the audio bitrate when encoding video only', async () => {
    useFakeRecorder(['video/mp4;codecs=avc1.640029']);

    await startCanvasRecorder(fakeStream(), { videoBitsPerSecond: 9_000_000 });

    const { options } = FakeMediaRecorder.constructed[0];
    expect(options.videoBitsPerSecond).toBe(9_000_000);
    expect(options.audioBitsPerSecond).toBeUndefined();
  });

  it('moves to the next candidate when the recorder rejects one', async () => {
    useFakeRecorder(
      ['video/mp4;codecs=avc1.640029', 'video/webm;codecs=vp9'],
      ['video/mp4;codecs=avc1.640029']
    );

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
    });

    expect(session.mimeType).toBe('video/webm;codecs=vp9');
  });

  it('explains the problem when MediaRecorder is missing entirely', async () => {
    delete (globalThis as Record<string, unknown>).MediaRecorder;

    await expect(
      startCanvasRecorder(fakeStream(), { videoBitsPerSecond: 12_000_000 })
    ).rejects.toThrow(/not supported in this browser/);
  });

  it('resolves the recorded chunks as a single blob on stop', async () => {
    useFakeRecorder(['video/mp4;codecs=avc1.640029']);

    const session = await startCanvasRecorder(fakeStream(), {
      videoBitsPerSecond: 12_000_000,
    });
    const blob = await session.stop();

    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('video/mp4;codecs=avc1.640029');
  });
});

describe('captureElementAudio', () => {
  function stubAudioContext() {
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const track = { stop: vi.fn(), kind: 'audio' };
    const destination = { stream: { getAudioTracks: () => [track] } };
    const context = {
      destination: { speakers: true },
      createMediaElementSource: vi.fn(() => source),
      createMediaStreamDestination: vi.fn(() => destination),
      resume: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    };
    (globalThis as Record<string, unknown>).AudioContext = vi.fn(() => context);
    return { context, source, track, destination };
  }

  it('unmutes the element so the graph actually receives samples', () => {
    stubAudioContext();
    const video = document.createElement('video');
    video.muted = true;

    captureElementAudio(video);

    expect(video.muted).toBe(false);
  });

  it('never wires the graph to the speakers', () => {
    const { context, source, destination } = stubAudioContext();
    const video = document.createElement('video');

    captureElementAudio(video);

    expect(source.connect).toHaveBeenCalledWith(destination);
    expect(source.connect).not.toHaveBeenCalledWith(context.destination);
  });

  it('returns null when the browser has no Web Audio', () => {
    delete (globalThis as Record<string, unknown>).AudioContext;

    expect(captureElementAudio(document.createElement('video'))).toBeNull();
  });

  it('cleans up and re-mutes on dispose', () => {
    const { context, source, track } = stubAudioContext();
    const video = document.createElement('video');

    const capture = captureElementAudio(video);
    capture?.dispose();

    expect(video.muted).toBe(true);
    expect(source.disconnect).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
    expect(context.close).toHaveBeenCalled();
  });
});

describe('probeFrameRate', () => {
  function videoPresenting(frames: Array<[number, number]>) {
    const video = document.createElement('video');
    let index = 0;
    (video as unknown as Record<string, unknown>).requestVideoFrameCallback = (
      cb: (now: number, metadata: unknown) => void
    ) => {
      const frame = frames[index++];
      if (frame) {
        queueMicrotask(() =>
          cb(0, { mediaTime: frame[0], presentedFrames: frame[1] })
        );
      }
      return index;
    };
    return video;
  }

  it('measures 60fps from presented frame metadata', async () => {
    const frames: Array<[number, number]> = Array.from({ length: 7 }, (_, i) => [
      i / 60,
      100 + i,
    ]);

    await expect(probeFrameRate(videoPresenting(frames), 20)).resolves.toBe(60);
  });

  it('measures 30fps from presented frame metadata', async () => {
    const frames: Array<[number, number]> = Array.from({ length: 7 }, (_, i) => [
      i / 30,
      i,
    ]);

    await expect(probeFrameRate(videoPresenting(frames), 20)).resolves.toBe(30);
  });

  it('falls back to 30 when the browser has no frame callback', async () => {
    await expect(
      probeFrameRate(document.createElement('video'), 20)
    ).resolves.toBe(30);
  });

  it('falls back to 30 when too few frames arrive to measure', async () => {
    await expect(probeFrameRate(videoPresenting([[0, 1]]), 20)).resolves.toBe(30);
  });
});

describe('attachFramePump', () => {
  function playableVideo() {
    const video = document.createElement('video');
    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    Object.defineProperty(video, 'ended', { value: false, configurable: true });
    return video;
  }

  it('drives a frame callback per presented frame while playing', async () => {
    const video = playableVideo();
    let pending: (() => void) | null = null;
    (video as unknown as Record<string, unknown>).requestVideoFrameCallback = (
      cb: () => void
    ) => {
      pending = cb;
      return 1;
    };
    const onFrame = vi.fn();

    const stop = attachFramePump(video, onFrame);
    expect(onFrame).toHaveBeenCalledTimes(1);

    pending?.();
    expect(onFrame).toHaveBeenCalledTimes(2);

    stop();
    pending?.();
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it('does not emit frames while the video is paused', () => {
    const video = document.createElement('video');
    (video as unknown as Record<string, unknown>).requestVideoFrameCallback = () => 1;
    const onFrame = vi.fn();

    attachFramePump(video, onFrame);

    expect(onFrame).not.toHaveBeenCalled();
  });
});

describe('readBlobDuration', () => {
  function stubCreatedVideo(duration: number) {
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const element = create(tag);
      if (tag === 'video') {
        Object.defineProperty(element, 'readyState', { value: 2 });
        Object.defineProperty(element, 'duration', { value: duration });
      }
      return element;
    }) as never);
  }

  it('reads the duration of an encoded clip', async () => {
    stubCreatedVideo(12.5);

    await expect(readBlobDuration(new Blob(['x']))).resolves.toBe(12.5);
  });

  it('returns null when the container reports no usable duration', async () => {
    stubCreatedVideo(Number.POSITIVE_INFINITY);

    await expect(readBlobDuration(new Blob(['x']))).resolves.toBeNull();
  });

  it('revokes the temporary object URL', async () => {
    stubCreatedVideo(3);

    await readBlobDuration(new Blob(['x']));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('video element helpers', () => {
  it('resolves immediately when the video already has data', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'readyState', { value: 2 });

    await expect(waitForVideoData(video)).resolves.toBeUndefined();
  });

  it('rejects with upload guidance when the video errors', async () => {
    const video = document.createElement('video');
    const pending = waitForVideoData(video);
    video.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow(/MP4 or WebM/);
  });

  it('resolves without seeking when already at the requested time', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'readyState', { value: 2 });

    await expect(waitForVideoTime(video, 0)).resolves.toBeUndefined();
  });

  it('seeks and resolves once the seek completes', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'readyState', { value: 2 });

    const pending = waitForVideoTime(video, 4);
    expect(video.currentTime).toBe(4);
    video.dispatchEvent(new Event('seeked'));

    await expect(pending).resolves.toBeUndefined();
  });

  it('mounts elements out of view without capturing pointer input', () => {
    const canvas = makeCanvas(16, 16);

    mountOffscreen(canvas);

    expect(canvas.parentElement).toBe(document.body);
    expect(canvas.style.opacity).toBe('0');
    expect(canvas.style.pointerEvents).toBe('none');
    canvas.remove();
  });

  it('waits for a rendering frame', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    await expect(waitOneFrame()).resolves.toBeUndefined();
  });
});

describe('requestCanvasFrame', () => {
  it('pushes exactly one frame into the capture track', () => {
    const requestFrame = vi.fn();
    const stream = {
      getVideoTracks: () => [{ requestFrame }],
    } as unknown as MediaStream;

    requestCanvasFrame(stream);

    expect(requestFrame).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the track cannot be driven manually', () => {
    const stream = { getVideoTracks: () => [{}] } as unknown as MediaStream;

    expect(() => requestCanvasFrame(stream)).not.toThrow();
  });
});

describe('applyColorMatrix', () => {
  function pixel(r: number, g: number, b: number, a = 255) {
    const data = new ImageData(1, 1);
    data.data.set([r, g, b, a]);
    return data;
  }

  it('leaves pixels untouched for an identity matrix', () => {
    const result = applyColorMatrix(pixel(10, 120, 230), IDENTITY_MATRIX);

    expect(Array.from(result.data)).toEqual([10, 120, 230, 255]);
  });

  it('preserves the alpha channel', () => {
    const result = applyColorMatrix(pixel(10, 20, 30, 128), IDENTITY_MATRIX);

    expect(result.data[3]).toBe(128);
  });

  it('scales the offset column by full range', () => {
    const offsetMatrix = [...IDENTITY_MATRIX];
    offsetMatrix[4] = 0.2;

    const result = applyColorMatrix(pixel(0, 0, 0), offsetMatrix);

    expect(result.data[0]).toBe(51);
  });

  it('clamps channels that overflow or underflow', () => {
    const hot = [...IDENTITY_MATRIX];
    hot[0] = 4;
    hot[6] = -4;

    const result = applyColorMatrix(pixel(200, 200, 200), hot);

    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(0);
  });
});

describe('imageDataToJpegUrl', () => {
  it('encodes the frame to an object URL', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => ({ putImageData: vi.fn() })) as never
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      ((cb: BlobCallback) => cb(new Blob(['jpeg']))) as never
    );

    await expect(imageDataToJpegUrl(new ImageData(2, 2))).resolves.toBe(
      'blob:mock-url'
    );
  });

  it('rejects when the browser cannot encode the preview', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => ({ putImageData: vi.fn() })) as never
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      ((cb: BlobCallback) => cb(null)) as never
    );

    await expect(imageDataToJpegUrl(new ImageData(2, 2))).rejects.toThrow(
      /Could not create preview/
    );
  });

  it('rejects when there is no 2d context', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => null) as never
    );

    await expect(imageDataToJpegUrl(new ImageData(2, 2))).rejects.toThrow(
      /canvas context/
    );
  });
});
