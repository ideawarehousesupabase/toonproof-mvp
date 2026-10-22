/**
 * Client-side preview generation for registered assets.
 * Produces a small JPEG data URL that is stored with the asset record so creators can
 * visually identify their assets. No external libraries — everything runs in the browser.
 *
 * Supported sources (in order of attempt):
 *  1. Any image the browser can decode (PNG, JPG, GIF, WebP, SVG, AVIF, BMP, …)
 *  2. Videos the browser can play (MP4, WebM, MOV, …) — a frame is captured
 *  3. Photoshop PSD / PSB — merged composite image, falling back to the embedded thumbnail
 *  4. Zip-based art files — Krita (.kra), OpenRaster (.ora), Procreate (.procreate), …
 *  5. Any file carrying an embedded Photoshop thumbnail (e.g. Photoshop TIFF / JPEG)
 *  6. Any file carrying an XMP thumbnail (Illustrator .ai, Adobe PDF / EPS / InDesign, …)
 * Returns undefined when no preview can be produced; the UI then asks for a preview image.
 */

const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.75;
const MAX_DATA_URL_LENGTH = 120_000; // ~90 KB, keeps localStorage / Firestore docs small
const LOAD_TIMEOUT_MS = 25_000;
const MAX_PARSE_BYTES = 1024 * 1024 * 1024; // don't read files over 1 GB into memory
const MAX_SCAN_BYTES = 300 * 1024 * 1024; // byte-scanning for embedded thumbnails
const COMPOSITE_MAX_DIMENSION = 1024;

/** File types the manual "preview image" picker accepts. */
export const PREVIEW_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/svg+xml,.psd";

const NATIVE_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
  "bmp",
  "ico",
  "tif",
  "tiff",
  "jfif",
  "pjpeg",
  "pjp",
  "apng",
  "cur",
  "heic",
  "heif",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "ogg", "ogv", "avi", "m4v", "mkv"]);

/** Preview images stored inside zip-based creative file formats, best first. */
const ZIP_PREVIEW_ENTRIES = [
  "mergedimage.png", // Krita, OpenRaster
  "preview.png", // Krita
  "Thumbnails/thumbnail.png", // OpenRaster
  "QuickLook/Thumbnail.png", // Procreate
  "docProps/thumbnail.jpeg", // Office documents
  "docProps/thumbnail.png",
];

export function fileExtension(name: string | undefined): string {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() ?? "";
}

// --------------------------------------------------------------------------
// Canvas helpers
// --------------------------------------------------------------------------

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawToDataUrl(
  source: CanvasImageSource,
  width: number,
  height: number,
  options: { swapRedBlue?: boolean } = {},
): string | undefined {
  if (!width || !height) return undefined;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  // White backdrop so transparent PNG / SVG artwork doesn't render black in JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);

  try {
    if (options.swapRedBlue) {
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]!;
        d[i] = d[i + 2]!;
        d[i + 2] = r;
      }
      ctx.putImageData(img, 0, 0);
    }

    let quality = JPEG_QUALITY;
    let url = canvas.toDataURL("image/jpeg", quality);
    while (url.length > MAX_DATA_URL_LENGTH && quality > 0.35) {
      quality -= 0.1;
      url = canvas.toDataURL("image/jpeg", quality);
    }
    return url.length <= MAX_DATA_URL_LENGTH && url.startsWith("data:image/") ? url : undefined;
  } catch {
    // Canvas may be tainted (e.g. SVG with external references)
    return undefined;
  }
}

function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

async function imageBlobThumbnail(
  blob: Blob,
  options: { swapRedBlue?: boolean } = {},
): Promise<string | undefined> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    if (!img) return undefined;
    // SVGs without intrinsic size report 0 — fall back to a square canvas.
    const width = img.naturalWidth || MAX_DIMENSION;
    const height = img.naturalHeight || MAX_DIMENSION;
    return drawToDataUrl(img, width, height, options);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function videoThumbnail(file: File): Promise<string | undefined> {
  const url = URL.createObjectURL(file);
  return new Promise<string | undefined>((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      // Skip a little way in to avoid a black first frame.
      const target = Math.min(0.5, (video.duration || 1) / 2);
      if (Math.abs(video.currentTime - target) < 0.01) {
        resolve(drawToDataUrl(video, video.videoWidth, video.videoHeight));
      } else {
        video.currentTime = target;
      }
    };
    video.onseeked = () => {
      resolve(drawToDataUrl(video, video.videoWidth, video.videoHeight));
    };
    video.onerror = () => resolve(undefined);
    video.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

// --------------------------------------------------------------------------
// Byte helpers
// --------------------------------------------------------------------------

function asciiBytes(text: string) {
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

function indexOfBytes(hay: Uint8Array, needle: Uint8Array, from = 0, to = hay.length): number {
  const first = needle[0];
  const end = Math.min(to, hay.length) - needle.length;
  outer: for (let i = Math.max(0, from); i <= end; i++) {
    if (hay[i] !== first) continue;
    for (let j = 1; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/** PackBits (RLE) decoder used by PSD image data. */
function unpackBits(src: Uint8Array, start: number, end: number, dst: Uint8Array) {
  let i = start;
  let o = 0;
  const stop = Math.min(end, src.length);
  while (i < stop && o < dst.length) {
    const n = src[i++]!;
    if (n < 128) {
      const len = Math.min(n + 1, dst.length - o, stop - i);
      dst.set(src.subarray(i, i + len), o);
      i += n + 1;
      o += len;
    } else if (n > 128) {
      const len = Math.min(257 - n, dst.length - o);
      dst.fill(src[i++] ?? 0, o, o + len);
      o += len;
    }
    // n === 128 is a no-op
  }
}

// --------------------------------------------------------------------------
// Photoshop (PSD / PSB)
// --------------------------------------------------------------------------

type PsdThumb = { jpeg: Uint8Array<ArrayBuffer>; bgr: boolean };

/** Reads a Photoshop thumbnail image resource (1036 / legacy 1033) at `dataPos`. */
function readPsdThumbResource(
  buf: ArrayBuffer,
  dv: DataView,
  id: number,
  dataPos: number,
  size: number,
): PsdThumb | undefined {
  if ((id !== 1036 && id !== 1033) || size <= 28) return undefined;
  if (dataPos + size > buf.byteLength) return undefined;
  if (dv.getUint32(dataPos) !== 1) return undefined; // 1 = JPEG RGB
  return { jpeg: new Uint8Array(buf, dataPos + 28, size - 28), bgr: id === 1033 };
}

function decodePsdComposite(
  buf: ArrayBuffer,
  dv: DataView,
  pos: number,
  header: {
    version: number;
    channels: number;
    width: number;
    height: number;
    depth: number;
    colorMode: number;
    hasAlpha: boolean;
  },
): HTMLCanvasElement | undefined {
  const { version, channels, width, height, depth, colorMode, hasAlpha } = header;
  if (!width || !height || (depth !== 8 && depth !== 16)) return undefined;
  if (pos + 2 > buf.byteLength) return undefined;

  // 1 = Grayscale, 3 = RGB, 4 = CMYK, 8 = Duotone
  const colorChannels =
    colorMode === 3 ? 3 : colorMode === 4 ? 4 : colorMode === 1 || colorMode === 8 ? 1 : 0;
  if (!colorChannels || channels < colorChannels) return undefined;
  const alphaChannel = hasAlpha && channels > colorChannels ? colorChannels : -1;
  const usedChannels = alphaChannel >= 0 ? colorChannels + 1 : colorChannels;

  const compression = dv.getUint16(pos);
  pos += 2;
  if (compression !== 0 && compression !== 1) return undefined;

  const scale = Math.min(1, COMPOSITE_MAX_DIMENSION / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  // Map each needed source row to its output row, and output columns to source columns.
  const rowTarget = new Int32Array(height).fill(-1);
  for (let y = 0; y < outH; y++) {
    rowTarget[Math.min(height - 1, Math.floor((y + 0.5) / scale))] = y;
  }
  const bytesPerSample = depth / 8;
  const colSource = new Int32Array(outW);
  for (let x = 0; x < outW; x++) {
    colSource[x] = Math.min(width - 1, Math.floor((x + 0.5) / scale)) * bytesPerSample;
  }

  const bytes = new Uint8Array(buf);
  const rowBytes = width * bytesPerSample;
  const rowBuf = new Uint8Array(rowBytes);
  const planes = Array.from({ length: usedChannels }, () => new Uint8Array(outW * outH));

  const sampleRow = (channel: number, row: number, source: Uint8Array) => {
    const plane = channel === alphaChannel ? planes[colorChannels] : planes[channel];
    const outRow = rowTarget[row]!;
    if (!plane || outRow < 0) return;
    const base = outRow * outW;
    for (let x = 0; x < outW; x++) plane[base + x] = source[colSource[x]!] ?? 0;
  };

  const wanted = (channel: number) => channel < colorChannels || channel === alphaChannel;

  if (compression === 1) {
    const countSize = version === 1 ? 2 : 4;
    const total = channels * height;
    let offset = pos + total * countSize;
    if (offset > buf.byteLength) return undefined;
    for (let idx = 0; idx < total; idx++) {
      const countPos = pos + idx * countSize;
      const count = countSize === 2 ? dv.getUint16(countPos) : dv.getUint32(countPos);
      const channel = Math.floor(idx / height);
      const row = idx % height;
      if (wanted(channel) && rowTarget[row]! >= 0) {
        if (offset + count > buf.byteLength) return undefined;
        rowBuf.fill(0);
        unpackBits(bytes, offset, offset + count, rowBuf);
        sampleRow(channel, row, rowBuf);
      }
      offset += count;
    }
  } else {
    for (let channel = 0; channel < channels; channel++) {
      if (!wanted(channel)) continue;
      for (let row = 0; row < height; row++) {
        if (rowTarget[row]! < 0) continue;
        const start = pos + (channel * height + row) * rowBytes;
        if (start + rowBytes > buf.byteLength) return undefined;
        sampleRow(channel, row, bytes.subarray(start, start + rowBytes));
      }
    }
  }

  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const image = ctx.createImageData(outW, outH);
  const d = image.data;
  const [p0, p1, p2, p3] = planes;
  const alpha = alphaChannel >= 0 ? planes[colorChannels] : undefined;
  let uniform = true;

  for (let i = 0, o = 0; i < outW * outH; i++, o += 4) {
    let r: number;
    let g: number;
    let b: number;
    if (colorChannels === 3) {
      r = p0![i]!;
      g = p1![i]!;
      b = p2![i]!;
    } else if (colorChannels === 4) {
      // PSD stores CMYK inverted (255 = no ink)
      const k = p3![i]!;
      r = (p0![i]! * k) / 255;
      g = (p1![i]! * k) / 255;
      b = (p2![i]! * k) / 255;
    } else {
      r = g = b = p0![i]!;
    }
    if (alpha) {
      const a = alpha[i]! / 255;
      r = r * a + 255 * (1 - a);
      g = g * a + 255 * (1 - a);
      b = b * a + 255 * (1 - a);
    }
    d[o] = r;
    d[o + 1] = g;
    d[o + 2] = b;
    d[o + 3] = 255;
    if (uniform && o > 0 && (d[o] !== d[0] || d[o + 1] !== d[1] || d[o + 2] !== d[2])) {
      uniform = false;
    }
  }

  // A blank composite means "Maximize Compatibility" was off — use the embedded thumbnail.
  if (uniform) return undefined;
  ctx.putImageData(image, 0, 0);
  return canvas;
}

async function psdThumbnail(buf: ArrayBuffer): Promise<string | undefined> {
  const dv = new DataView(buf);
  if (buf.byteLength < 34 || dv.getUint32(0) !== 0x38425053) return undefined; // "8BPS"
  const version = dv.getUint16(4);
  if (version !== 1 && version !== 2) return undefined;
  const channels = dv.getUint16(12);
  const height = dv.getUint32(14);
  const width = dv.getUint32(18);
  const depth = dv.getUint16(22);
  const colorMode = dv.getUint16(24);

  let pos = 26;
  pos += 4 + dv.getUint32(pos); // color mode data

  // Image resources — look for the embedded JPEG thumbnail.
  const resLength = dv.getUint32(pos);
  pos += 4;
  const resEnd = Math.min(pos + resLength, buf.byteLength);
  let thumb: PsdThumb | undefined;
  let p = pos;
  while (p + 12 <= resEnd) {
    const id = dv.getUint16(p + 4);
    const nameLength = dv.getUint8(p + 6);
    let q = p + 7 + nameLength;
    if ((1 + nameLength) % 2) q += 1;
    if (q + 4 > resEnd) break;
    const size = dv.getUint32(q);
    q += 4;
    const found = readPsdThumbResource(buf, dv, id, q, size);
    if (found && (!thumb || !found.bgr)) thumb = found;
    p = q + size + (size % 2);
  }
  pos = resEnd;

  // Layer & mask section — only needed to know whether the composite has transparency.
  let hasAlpha = false;
  if (pos + (version === 1 ? 4 : 8) <= buf.byteLength) {
    const sectionLength = version === 1 ? dv.getUint32(pos) : Number(dv.getBigUint64(pos));
    const sectionStart = pos + (version === 1 ? 4 : 8);
    const lengthSize = version === 1 ? 4 : 8;
    if (sectionLength >= lengthSize + 2 && sectionStart + lengthSize + 2 <= buf.byteLength) {
      const layerInfoLength =
        version === 1 ? dv.getUint32(sectionStart) : Number(dv.getBigUint64(sectionStart));
      // A negative layer count means the first extra channel is the merged transparency.
      if (layerInfoLength >= 2) hasAlpha = dv.getInt16(sectionStart + lengthSize) < 0;
    }
    pos = sectionStart + sectionLength;
  }

  try {
    const composite = decodePsdComposite(buf, dv, pos, {
      version,
      channels,
      width,
      height,
      depth,
      colorMode,
      hasAlpha,
    });
    if (composite) {
      const url = drawToDataUrl(composite, composite.width, composite.height);
      if (url) return url;
    }
  } catch {
    // fall through to the embedded thumbnail
  }

  if (thumb) {
    return imageBlobThumbnail(new Blob([thumb.jpeg], { type: "image/jpeg" }), {
      swapRedBlue: thumb.bgr,
    });
  }
  return undefined;
}

// --------------------------------------------------------------------------
// Zip-based formats (Krita, OpenRaster, Procreate, …)
// --------------------------------------------------------------------------

async function zipPreviewThumbnail(buf: ArrayBuffer): Promise<string | undefined> {
  const dv = new DataView(buf);
  const len = buf.byteLength;
  if (len < 22 || dv.getUint32(0, true) !== 0x04034b50) return undefined; // "PK\3\4"

  let eocd = -1;
  for (let i = len - 22; i >= Math.max(0, len - 22 - 0xffff); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return undefined;
  const entryCount = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (cdOffset === 0xffffffff || cdOffset >= len) return undefined; // zip64 not supported

  const wanted = ZIP_PREVIEW_ENTRIES.map((n) => n.toLowerCase());
  const decoder = new TextDecoder();
  let best: { rank: number; method: number; size: number; localOffset: number } | undefined;

  let p = cdOffset;
  for (let i = 0; i < entryCount && p + 46 <= len; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const size = dv.getUint32(p + 20, true);
    const nameLength = dv.getUint16(p + 28, true);
    const extraLength = dv.getUint16(p + 30, true);
    const commentLength = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = decoder.decode(new Uint8Array(buf, p + 46, Math.min(nameLength, len - p - 46)));
    const rank = wanted.indexOf(name.toLowerCase());
    if (rank >= 0 && (!best || rank < best.rank)) best = { rank, method, size, localOffset };
    p += 46 + nameLength + extraLength + commentLength;
  }
  if (!best || best.localOffset + 30 > len) return undefined;
  if (dv.getUint32(best.localOffset, true) !== 0x04034b50) return undefined;

  const dataStart =
    best.localOffset +
    30 +
    dv.getUint16(best.localOffset + 26, true) +
    dv.getUint16(best.localOffset + 28, true);
  if (dataStart + best.size > len) return undefined;
  const data = new Uint8Array(buf, dataStart, best.size);

  let blob: Blob;
  if (best.method === 0) {
    blob = new Blob([data]);
  } else if (best.method === 8 && typeof DecompressionStream !== "undefined") {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    blob = await new Response(stream).blob();
  } else {
    return undefined;
  }
  return imageBlobThumbnail(blob);
}

// --------------------------------------------------------------------------
// Embedded thumbnails found anywhere in the file
// --------------------------------------------------------------------------

/** Photoshop image resource 1036 ("8BIM" + 0x040C) — present in Photoshop TIFF / JPEG / EPS. */
async function embeddedPhotoshopThumbnail(buf: ArrayBuffer): Promise<string | undefined> {
  const bytes = new Uint8Array(buf);
  const dv = new DataView(buf);
  const needle = Uint8Array.from([0x38, 0x42, 0x49, 0x4d, 0x04, 0x0c]);
  const limit = Math.min(bytes.length, MAX_SCAN_BYTES);
  let at = indexOfBytes(bytes, needle, 0, limit);
  while (at >= 0) {
    const nameLength = bytes[at + 6] ?? 0;
    let q = at + 7 + nameLength;
    if ((1 + nameLength) % 2) q += 1;
    if (q + 4 <= bytes.length) {
      const size = dv.getUint32(q);
      const thumb = readPsdThumbResource(buf, dv, 1036, q + 4, size);
      if (thumb) {
        const url = await imageBlobThumbnail(new Blob([thumb.jpeg], { type: "image/jpeg" }));
        if (url) return url;
      }
    }
    at = indexOfBytes(bytes, needle, at + 1, limit);
  }
  return undefined;
}

/** XMP thumbnail (xmpGImg:image) — written by Illustrator, InDesign and other Adobe apps. */
async function xmpThumbnail(buf: ArrayBuffer): Promise<string | undefined> {
  const bytes = new Uint8Array(buf);
  const limit = Math.min(bytes.length, MAX_SCAN_BYTES);
  const tag = asciiBytes("xmpGImg:image");
  let at = indexOfBytes(bytes, tag, 0, limit);
  while (at >= 0) {
    let start = at + tag.length;
    const opener = bytes[start];
    let terminator: number | undefined;
    if (opener === 0x3e) {
      terminator = 0x3c; // <xmpGImg:image>…</xmpGImg:image>
      start += 1;
    } else if (opener === 0x3d && (bytes[start + 1] === 0x22 || bytes[start + 1] === 0x27)) {
      terminator = bytes[start + 1]; // xmpGImg:image="…"
      start += 2;
    }
    if (terminator !== undefined) {
      const end = bytes.indexOf(terminator, start);
      if (end > start && end - start < 4 * 1024 * 1024) {
        let text = "";
        for (let i = start; i < end; i++) text += String.fromCharCode(bytes[i]!);
        const base64 = text.replace(/&#x?[0-9a-fA-F]+;/g, "").replace(/[^A-Za-z0-9+/=]/g, "");
        try {
          const raw = atob(base64);
          const jpeg = Uint8Array.from(raw, (c) => c.charCodeAt(0));
          const url = await imageBlobThumbnail(new Blob([jpeg], { type: "image/jpeg" }));
          if (url) return url;
        } catch {
          // not valid base64 — keep scanning
        }
      }
    }
    at = indexOfBytes(bytes, tag, at + tag.length, limit);
  }
  return undefined;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

async function generate(file: File): Promise<string | undefined> {
  const ext = fileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  const isPsd = ext === "psd" || ext === "psb" || mime.includes("photoshop");

  // 1. Natively decodable images
  if (!isPsd && (mime.startsWith("image/") || NATIVE_IMAGE_EXTENSIONS.has(ext))) {
    const url = await imageBlobThumbnail(file).catch(() => undefined);
    if (url) return url;
  }

  // 2. Videos
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) {
    const url = await videoThumbnail(file).catch(() => undefined);
    if (url) return url;
  }

  // 3–6. Parse the file contents for a composite / embedded preview
  if (file.size > MAX_PARSE_BYTES) return undefined;
  const buf = await file.arrayBuffer();
  const parsers = [psdThumbnail, zipPreviewThumbnail, embeddedPhotoshopThumbnail, xmpThumbnail];
  for (const parse of parsers) {
    try {
      const url = await parse(buf);
      if (url) return url;
    } catch {
      // try the next strategy
    }
  }
  return undefined;
}

export async function createThumbnail(file: File): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    return await Promise.race([
      generate(file),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), LOAD_TIMEOUT_MS)),
    ]);
  } catch {
    return undefined;
  }
}

/**
 * 64-bit difference hash (dHash) of a preview image — a genuine perceptual fingerprint:
 * visually similar images produce identical or near-identical hashes.
 */
export async function perceptualHashFromDataUrl(dataUrl: string): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const img = await loadImage(dataUrl);
    if (!img) return undefined;
    const canvas = createCanvas(9, 8);
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, 9, 8);
    const d = ctx.getImageData(0, 0, 9, 8).data;
    const gray = (x: number, y: number) => {
      const i = (y * 9 + x) * 4;
      return d[i]! * 0.299 + d[i + 1]! * 0.587 + d[i + 2]! * 0.114;
    };
    let hex = "";
    for (let y = 0; y < 8; y++) {
      let byte = 0;
      for (let x = 0; x < 8; x++) byte = (byte << 1) | (gray(x, y) > gray(x + 1, y) ? 1 : 0);
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  } catch {
    return undefined;
  }
}
