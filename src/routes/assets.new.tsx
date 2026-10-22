import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, UploadCloud, ArrowRight, ShieldCheck, ImagePlus, Loader2 } from "lucide-react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { AssetThumb } from "@/components/AssetThumb";
import { Alert, Card, Field, PageHeader, StatusBadge } from "@/components/ui-kit";
import { ASSET_TYPES } from "@/lib/mock";
import { computeFileSha256 } from "@/lib/processing-engine";
import {
  PREVIEW_IMAGE_ACCEPT,
  createThumbnail,
  fileExtension,
  perceptualHashFromDataUrl,
} from "@/lib/thumbnail";
import { registerAsset } from "@/lib/vault";

export const Route = createFileRoute("/assets/new")({
  head: () => ({
    meta: [
      { title: "Register New Asset — ToonProof" },
      {
        name: "description",
        content:
          "Register an animation asset to create a fingerprint and timestamped provenance record.",
      },
      { property: "og:title", content: "Register New Asset — ToonProof" },
      {
        property: "og:description",
        content:
          "Register an animation asset to create a fingerprint and timestamped provenance record.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterAsset,
});

const STEPS = [
  "Asset classified by structure",
  "Exact SHA-256 cryptographic fingerprint generated",
  "Perceptual visual hash (pHash) synthesized",
  "Timestamped provenance record created",
  "AI permission token minted",
  "Protection policy committed to vault",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RegisterAsset() {
  const { session } = useRequireSession();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>(ASSET_TYPES[0]);
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [file, setFile] = useState<{ name: string; size: string; type?: string } | null>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [previewSource, setPreviewSource] = useState<"file" | "manual" | undefined>(undefined);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "generating" | "ready" | "missing">(
    "idle",
  );
  const [manualBusy, setManualBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const pickToken = useRef(0);
  const manualInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [progress, setProgress] = useState(0);
  const [createdAssetId, setCreatedAssetId] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>("");

  const busy = previewStatus === "generating" || manualBusy;

  // A file dropped just outside the drop zone would otherwise open in the tab and lose the form.
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  async function handleSourceFile(f: File) {
    if (f.size === 0) {
      setError("That file is empty. Please choose the actual asset file.");
      return;
    }
    setSourceFile(f);
    setFile({
      name: f.name,
      size: formatFileSize(f.size),
      type: f.type || "application/octet-stream",
    });
    setError("");
    setPreviewError("");

    // Guard against an older selection resolving after a newer one
    const token = ++pickToken.current;
    setThumbnail(undefined);
    setPreviewSource(undefined);
    setManualBusy(false);
    setPreviewStatus("generating");
    const thumb = await createThumbnail(f);
    if (token !== pickToken.current) return;
    if (thumb) {
      setThumbnail(thumb);
      setPreviewSource("file");
      setPreviewStatus("ready");
    } else {
      setPreviewStatus("missing");
    }
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    // Reset so re-selecting the same file still fires onChange
    e.target.value = "";
    if (f) void handleSourceFile(f);
  }

  function dropFile(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleSourceFile(f);
  }

  async function pickManualPreview(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const token = pickToken.current;
    setPreviewError("");
    setManualBusy(true);
    const thumb = await createThumbnail(f);
    if (token !== pickToken.current) return;
    setManualBusy(false);
    if (!thumb) {
      setPreviewError("We couldn't read that image. Please choose a PNG or JPG file.");
      return;
    }
    setThumbnail(thumb);
    setPreviewSource("manual");
    setPreviewStatus("ready");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");

    if (!session) {
      setError("Please sign in to register assets.");
      return;
    }

    if (!name.trim() || !type || !file || !sourceFile) {
      setError("Please add an asset name, choose an asset type and select a file.");
      return;
    }

    if (!thumbnail) {
      setError("Please add a preview image below before registering this asset.");
      setPreviewError("A preview image is required so you can recognise this asset in your vault.");
      return;
    }

    setStage("processing");
    setProgress(0);

    // Animate progress steps
    STEPS.forEach((_, i) => {
      setTimeout(() => setProgress(i + 1), 300 * (i + 1));
    });

    try {
      // Fingerprint the actual file contents and (when generated from the file) its pixels
      const [fileHash, visualHash] = await Promise.all([
        computeFileSha256(sourceFile),
        previewSource === "file" ? perceptualHashFromDataUrl(thumbnail) : Promise.resolve(undefined),
      ]);

      // Execute centralized deterministic processing engine & store in Firebase / Vault
      const result = await registerAsset(session.id, {
        name: name.trim(),
        type,
        description: description.trim(),
        collection: collection.trim(),
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type,
        thumbnail,
        previewSource,
        fileHash,
        visualHash,
      });

      setTimeout(() => {
        setCreatedAssetId(result.asset.id);
        setCreatedDate(result.asset.registeredOn);
        setStage("done");
      }, 300 * (STEPS.length + 1));
    } catch (err: unknown) {
      setStage("form");
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to register asset. Please try again.",
      );
    }
  }

  const preview = (
    <AssetThumb
      src={thumbnail}
      fileName={file?.name}
      mimeType={file?.type}
      alt={`Preview of ${name.trim() || file?.name || "asset"}`}
      size="lg"
      className="mb-4"
    />
  );

  if (stage === "processing") {
    return (
      <AppShell>
        <PageHeader
          title="Processing &amp; Registering Asset..."
          subtitle="Generating cryptographic signatures, AI permission tokens, and timestamped provenance record."
        />
        <Card className="max-w-xl">
          {preview}
          <ul className="space-y-3.5">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  i < progress ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                    i < progress
                      ? "bg-success text-success-foreground"
                      : "border border-border text-muted-foreground/40"
                  }`}
                >
                  <Check className="size-3.5 stroke-[3]" />
                </div>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </AppShell>
    );
  }

  if (stage === "done" && createdAssetId) {
    return (
      <AppShell>
        <PageHeader
          title="Asset Successfully Registered"
          subtitle="Your animation asset is now fingerprinted and protected in the vault."
        />
        <Card className="max-w-xl">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-xs font-semibold text-success">
            <ShieldCheck className="size-4" />
            <span>Cryptographic and perceptual DNA records committed to vault.</span>
          </div>

          {preview}

          <div className="space-y-3 text-sm">
            <Row label="Asset Name" value={name.trim()} />
            <Row label="Registration ID" value={<span className="font-mono">{createdAssetId}</span>} />
            <Row label="Asset Type" value={type} />
            <Row label="Status" value={<StatusBadge status="Verified" />} />
            <Row label="Registration Date" value={createdDate} />
            <Row label="Attached File" value={`${file?.name} (${file?.size})`} />
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <button
              className="btn-base btn-primary"
              onClick={() =>
                navigate({ to: "/assets/$assetId", params: { assetId: createdAssetId } })
              }
            >
              View Asset Details
              <ArrowRight className="size-3.5" />
            </button>
            <Link to="/assets" className="btn-base btn-outline">
              Back to My Assets
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  const ext = fileExtension(file?.name).toUpperCase();

  return (
    <AppShell>
      <PageHeader
        title="Register New Asset"
        subtitle="Create a protected cryptographic record for your animation work."
      />
      <Card className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          {error ? <Alert tone="error">{error}</Alert> : null}

          <Field label="Asset Name">
            <input
              className="field-input"
              placeholder="e.g. Luna Character Rig v2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Asset Type">
            <select
              className="field-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description" hint="Optional">
            <textarea
              rows={3}
              className="field-input"
              placeholder="Provide context or notes about this animation asset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Project / Collection" hint="Optional">
            <input
              className="field-input"
              placeholder="e.g. Season 1 • Episode 04"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-semibold">Asset Source File</span>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={dropFile}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors hover:bg-secondary/70 ${
                dragActive ? "border-accent bg-accent/10" : "border-border bg-secondary/40"
              }`}
            >
              <UploadCloud className="size-7 text-accent" />
              <span className="text-sm font-semibold text-foreground">
                {file ? "Click or drag to replace file" : "Click or drag file to select"}
              </span>
              <span className="text-xs text-muted-foreground">
                Any asset file: images, videos, PSD, AI, Krita, Procreate, rigs, models, JSON,
                ToonBoom. Files that can&rsquo;t be previewed will ask for a preview image.
              </span>
              <input type="file" className="hidden" onChange={pickFile} />
            </label>

            {file ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                {busy ? (
                  <div className="flex h-56 w-full flex-col items-center justify-center gap-2 bg-secondary/40 text-xs text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-accent" />
                    Generating preview...
                  </div>
                ) : thumbnail ? (
                  <AssetThumb
                    src={thumbnail}
                    fileName={file.name}
                    mimeType={file.type}
                    alt={`Preview of ${file.name}`}
                    size="lg"
                    className="rounded-none border-0"
                  />
                ) : (
                  <div className="flex min-h-56 w-full flex-col items-center justify-center gap-2 bg-secondary/40 px-6 py-6 text-center">
                    <ImagePlus className="size-9 text-accent" />
                    <p className="text-sm font-semibold text-foreground">Add a preview image</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                      {ext ? `${ext} files` : "This file type"} can&rsquo;t be displayed in the
                      browser. Add a picture of this asset (PNG, JPG or PSD) &mdash; a screenshot
                      or render works &mdash; so you can recognise it in your vault and on the
                      certificate.
                    </p>
                    <button
                      type="button"
                      className="btn-base btn-primary mt-1"
                      onClick={() => manualInput.current?.click()}
                    >
                      <ImagePlus className="size-4" />
                      Choose Preview Image
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 bg-success/10 px-3.5 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">{file.name}</p>
                    <p className="text-muted-foreground">
                      {file.size}
                      {previewSource === "manual" ? " · Preview image added by you" : ""}
                    </p>
                  </div>
                  {thumbnail && !busy ? (
                    <button
                      type="button"
                      className="shrink-0 font-semibold text-accent hover:underline"
                      onClick={() => manualInput.current?.click()}
                    >
                      Change preview
                    </button>
                  ) : (
                    <span className="shrink-0 font-semibold text-success">Ready for Hashing</span>
                  )}
                </div>
              </div>
            ) : null}
            {previewError ? (
              <p className="mt-2 text-xs font-medium text-destructive">{previewError}</p>
            ) : null}
            <input
              ref={manualInput}
              type="file"
              accept={PREVIEW_IMAGE_ACCEPT}
              className="hidden"
              onChange={pickManualPreview}
            />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-3">
            <button
              type="submit"
              className="btn-base btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
            >
              {busy ? "Preparing preview..." : "Register & Protect Asset"}
            </button>
            <Link to="/assets" className="btn-base btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
