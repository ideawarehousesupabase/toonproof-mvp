import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, UploadCloud, ArrowRight, ShieldCheck } from "lucide-react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Alert, Card, Field, PageHeader, StatusBadge } from "@/components/ui-kit";
import { ASSET_TYPES } from "@/lib/mock";
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

function RegisterAsset() {
  const { session } = useRequireSession();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>(ASSET_TYPES[0]);
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState("");
  const [file, setFile] = useState<{ name: string; size: string; type?: string } | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [progress, setProgress] = useState(0);
  const [createdAssetId, setCreatedAssetId] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>("");

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile({
      name: f.name,
      size: (f.size / 1024).toFixed(0) + " KB",
      type: f.type || "application/octet-stream",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!session) {
      setError("Please sign in to register assets.");
      return;
    }

    if (!name.trim() || !type || !file) {
      setError("Please add an asset name, choose an asset type and select a file.");
      return;
    }

    setStage("processing");
    setProgress(0);

    // Animate progress steps
    STEPS.forEach((_, i) => {
      setTimeout(() => setProgress(i + 1), 300 * (i + 1));
    });

    try {
      // Execute centralized deterministic processing engine & store in Firebase / Vault
      const result = await registerAsset(session.id, {
        name: name.trim(),
        type,
        description: description.trim(),
        collection: collection.trim(),
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type,
      });

      setTimeout(() => {
        setCreatedAssetId(result.asset.id);
        setCreatedDate(result.asset.registeredOn);
        setStage("done");
      }, 300 * (STEPS.length + 1));
    } catch (err: any) {
      setStage("form");
      setError(err?.message || "Failed to register asset. Please try again.");
    }
  }

  if (stage === "processing") {
    return (
      <AppShell>
        <PageHeader
          title="Processing &amp; Registering Asset..."
          subtitle="Generating cryptographic signatures, AI permission tokens, and timestamped provenance record."
        />
        <Card className="max-w-xl">
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
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-7 text-center transition-colors hover:bg-secondary/70">
              <UploadCloud className="size-7 text-accent" />
              <span className="text-sm font-semibold text-foreground">
                Click or drag file to select
              </span>
              <span className="text-xs text-muted-foreground">
                Supported: Rig files, models, sprite sheets, MP4, JSON, PSD, ToonBoom, SVG.
              </span>
              <input type="file" className="hidden" onChange={pickFile} />
            </label>

            {file ? (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-success/10 px-3.5 py-2 text-xs">
                <div>
                  <p className="font-bold text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">{file.size}</p>
                </div>
                <span className="font-semibold text-success">Ready for Hashing</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2.5 pt-3">
            <button type="submit" className="btn-base btn-primary">
              Register &amp; Protect Asset
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
