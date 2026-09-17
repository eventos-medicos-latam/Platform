type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' },
) => { data: string } | null;

let jsQrFn: JsQrFn | null = null;
const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
const ctx = canvas?.getContext('2d', { willReadFrequently: true }) ?? null;

export function createNativeQrDetector(): BarcodeDetectorLike | null {
  const Ctor = (window as unknown as {
    BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike;
  }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

export async function openRearCamera(): Promise<MediaStream> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('La cámara solo funciona en HTTPS. Abre el panel desde el dominio seguro.');
  }

  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: 'environment' } },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }

  const err = lastError as { name?: string } | undefined;
  if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
    throw new Error('Activa el permiso de cámara en el navegador para escanear.');
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    throw new Error('No se encontró una cámara en este dispositivo.');
  }
  throw new Error('No se pudo abrir la cámara. Revisa el permiso del navegador.');
}

export function attachCameraStream(video: HTMLVideoElement, stream: MediaStream) {
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
}

async function loadJsQr(): Promise<JsQrFn> {
  if (jsQrFn) return jsQrFn;
  const mod = await import('jsqr');
  jsQrFn = (mod.default ?? mod) as JsQrFn;
  return jsQrFn;
}

async function decodeWithJsQr(video: HTMLVideoElement): Promise<string | null> {
  if (!canvas || !ctx || video.videoWidth < 8 || video.videoHeight < 8) return null;
  const max = 640;
  const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
  const width = Math.max(1, Math.floor(video.videoWidth * scale));
  const height = Math.max(1, Math.floor(video.videoHeight * scale));
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(video, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const jsQR = await loadJsQr();
  const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
  return code?.data?.trim() || null;
}

export async function decodeQrFromVideo(
  video: HTMLVideoElement,
  native: BarcodeDetectorLike | null,
): Promise<string | null> {
  if (native) {
    try {
      const codes = await native.detect(video);
      const raw = codes[0]?.rawValue?.trim();
      if (raw) return raw;
    } catch {
      /* Safari/iOS often expose a stub that fails; fall through to jsQR */
    }
  }
  return decodeWithJsQr(video);
}

export function cameraErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'No se pudo abrir la cámara. Revisa el permiso del navegador.';
}
