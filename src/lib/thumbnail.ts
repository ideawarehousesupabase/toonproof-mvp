/**
 * Client-side preview generation for registered assets.
 * Produces a small JPEG data URL (images & videos) that is stored with the asset record
 * so creators can visually identify their assets. Unsupported formats return undefined.
 */

const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.72;
const MAX_DATA_URL_LENGTH = 120_000; // ~90 KB, keeps localStorage / Firestore docs small
const LOAD_TIMEOUT_MS = 10_000;

function drawToDataUrl(
  source: CanvasImageSource,
  width: number,
  height: number,
): string | undefined {
  if (!width || !height) return undefined;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  // White backdrop so transparent PNG / SVG artwork doesn't render black in JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);

  try {
    let quality = JPEG_QUALITY;
    let url = canvas.toDataURL("image/jpeg", quality);
    while (url.length > MAX_DATA_URL_LENGTH && quality > 0.35) {
      quality -= 0.15;
      url = canvas.toDataURL("image/jpeg", quality);
    }
    return url.length <= MAX_DATA_URL_LENGTH ? url : undefined;
  } catch {
    // Canvas may be tainted (e.g. SVG with external references)
    return undefined;
  }
}

function withTimeout<T>(promise: Promise<T>): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), LOAD_TIMEOUT_MS)),
  ]);
}

function imageThumbnail(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // SVGs without intrinsic size report 0 — fall back to a square canvas.
      const width = img.naturalWidth || MAX_DIMENSION;
      const height = img.naturalHeight || MAX_DIMENSION;
      resolve(drawToDataUrl(img, width, height));
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

function videoThumbnail(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      // Skip a few frames in to avoid a black first frame.
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      resolve(drawToDataUrl(video, video.videoWidth, video.videoHeight));
    };
    video.onerror = () => resolve(undefined);
    video.src = url;
  });
}

export async function createThumbnail(file: File): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;

  const mime = file.type || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  if (!isImage && !isVideo) return undefined;

  const url = URL.createObjectURL(file);
  try {
    return await withTimeout(isImage ? imageThumbnail(url) : videoThumbnail(url));
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
