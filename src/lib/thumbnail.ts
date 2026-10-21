/**
 * Client-side preview generation for registered assets.
 * Produces a small JPEG data URL (images & videos) that is stored with the asset record
 * so creators can visually identify their assets. Unsupported formats return undefined.
 */

const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.72;
const MAX_DATA_URL_LENGTH = 120_000; // ~90 KB, keeps localStorage / Firestore docs small
const LOAD_TIMEOUT_MS = 10_000;

/**
 * Browser-decodable image extensions — anything the <img> element can natively render.
 * PSD, AI, etc. are intentionally excluded because browsers cannot decode them.
 */
const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "avif",
  "bmp", "ico", "tif", "tiff", "jfif", "pjpeg", "pjp",
  "apng", "cur",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4", "webm", "mov", "ogg", "ogv", "avi", "m4v",
]);

/**
 * Determine whether a file is an image, video, or neither by checking
 * both the MIME type and the file extension. This handles the common case
 * where the browser reports an empty or generic MIME (application/octet-stream)
 * for valid image files.
 */
function classifyFile(file: File): "image" | "video" | null {
  const mime = (file.type || "").toLowerCase();

  // MIME type is the most reliable signal when present
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";

  // Fall back to extension when MIME is missing or generic
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";

  return null;
}

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
    // Prevent canvas tainting for SVGs and data URIs with external refs
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // SVGs without intrinsic size report 0 — fall back to a square canvas.
      const width = img.naturalWidth || MAX_DIMENSION;
      const height = img.naturalHeight || MAX_DIMENSION;
      resolve(drawToDataUrl(img, width, height));
    };
    img.onerror = () => {
      // Retry without crossOrigin — some blob URLs reject CORS
      const retry = new Image();
      retry.onload = () => {
        const width = retry.naturalWidth || MAX_DIMENSION;
        const height = retry.naturalHeight || MAX_DIMENSION;
        resolve(drawToDataUrl(retry, width, height));
      };
      retry.onerror = () => resolve(undefined);
      retry.src = url;
    };
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

  const kind = classifyFile(file);
  if (!kind) return undefined;

  const url = URL.createObjectURL(file);
  try {
    return await withTimeout(kind === "image" ? imageThumbnail(url) : videoThumbnail(url));
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
