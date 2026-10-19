import { File, FileJson, Film, Image as ImageIcon, Layers, type LucideIcon } from "lucide-react";

type AssetThumbProps = {
  src?: string | undefined;
  fileName?: string | undefined;
  mimeType?: string | undefined;
  alt: string;
  size?: "sm" | "lg";
  className?: string;
};

function iconFor(fileName = "", mimeType = ""): LucideIcon {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (
    mimeType.startsWith("image/") ||
    ["psd", "svg", "png", "jpg", "jpeg", "gif", "webp"].includes(ext)
  ) {
    return ImageIcon;
  }
  if (mimeType.startsWith("video/") || ["mp4", "mov", "webm", "avi"].includes(ext)) return Film;
  if (mimeType === "application/json" || ext === "json") return FileJson;
  if (
    ["tbp", "xstage", "riv", "spine", "skel", "fbx", "blend", "obj", "glb", "gltf"].includes(ext)
  ) {
    return Layers;
  }
  return File;
}

/**
 * Visual preview of an asset. Shows the stored thumbnail when available,
 * otherwise a file-type icon tile so every asset stays identifiable.
 */
export function AssetThumb({
  src,
  fileName,
  mimeType,
  alt,
  size = "sm",
  className = "",
}: AssetThumbProps) {
  const box = size === "lg" ? "h-56 w-full rounded-xl" : "size-10 shrink-0 rounded-lg";

  if (src) {
    return (
      <div className={`overflow-hidden border border-border bg-secondary/40 ${box} ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-full w-full ${size === "lg" ? "object-contain" : "object-cover"}`}
        />
      </div>
    );
  }

  const Icon = iconFor(fileName, mimeType);
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 border border-border bg-secondary/60 text-muted-foreground ${box} ${className}`}
      aria-label={alt}
      role="img"
    >
      <Icon className={size === "lg" ? "size-10 text-accent" : "size-5 text-accent"} />
      {size === "lg" ? (
        <span className="px-4 text-center text-xs">Preview not available for this file type</span>
      ) : null}
    </div>
  );
}
