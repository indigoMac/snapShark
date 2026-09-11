const MAX_OUTPUT_EDGE = 1920;
const MAX_BITRATE = 8_000_000;
const MIN_BITRATE = 1_500_000;

const RECORDER_TYPES = [
  'video/webm;codecs=vp8',
  'video/webm',
  'video/webm;codecs=vp9',
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
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

export function clampVideoBitrate(fileSizeBytes: number, durationSec: number): number {
  const fromFile = (fileSizeBytes * 8) / Math.max(durationSec, 0.1);
  return Math.min(MAX_BITRATE, Math.max(MIN_BITRATE, fromFile));
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

export async function readBlobDuration(blob: Blob): Promise<number> {
  const url = URL.createObjectURL(blob);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = url;
    await waitForVideoData(video);
    const duration = video.duration;
    video.src = '';
    return Number.isFinite(duration) ? duration : 0;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type CanvasRecorderSession = {
  recorder: MediaRecorder;
  mimeType: string;
  stop: () => Promise<Blob>;
};

export async function startCanvasRecorder(
  stream: MediaStream,
  bitsPerSecond: number
): Promise<CanvasRecorderSession> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Video colour-fix is not supported in this browser. Try the latest Chrome, Firefox, or Safari.'
    );
  }

  const candidates = [
    ...RECORDER_TYPES.filter((type) => MediaRecorder.isTypeSupported(type)),
    '',
  ];

  let lastError: unknown;
  for (const mimeType of candidates) {
    try {
      const options: MediaRecorderOptions = { videoBitsPerSecond: bitsPerSecond };
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

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

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
