import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Alert, Card, DetailRow, Field, PageHeader, StatusBadge, Toggle } from "@/components/ui-kit";
import {
  addShare,
  certIdFor,
  findAsset,
  getCertificate,
  getPermissions,
  getProvenance,
  getShares,
  issueCertificate,
  revokeShare,
  savePermissions,
  useVault,
} from "@/lib/vault";
import { downloadCertificate } from "@/lib/certificate";
import { Dna, Fingerprint, ShieldCheck, Share2, FileCheck2, History } from "lucide-react";
import type { Asset } from "@/lib/types";

export const Route = createFileRoute("/assets/$assetId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    const tab = search["tab"];
    return typeof tab === "string" ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Asset Details — ToonProof" },
      {
        name: "description",
        content: "Asset provenance, permissions, sharing history and certificate.",
      },
      { property: "og:title", content: "Asset Details — ToonProof" },
      {
        property: "og:description",
        content: "Asset provenance, permissions, sharing history and certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetDetails,
});

const TABS = ["Overview", "Permissions", "Sharing", "Provenance", "Certificate"] as const;
type Tab = (typeof TABS)[number];

function AssetDetails() {
  const { assetId } = Route.useParams();
  const search = Route.useSearch();
  const { session } = useRequireSession();
  const initialTab = TABS.find((t) => t === search.tab) ?? "Overview";
  const [tab, setTab] = useState<Tab>(initialTab);

  const ready = useVault(session?.id);
  const asset = ready && session ? findAsset(assetId, session.id) : undefined;
  const creator = session?.fullName ?? "Creator";

  if (!ready) {
    return (
      <AppShell>
        <div className="py-12 text-center text-sm text-muted-foreground">Loading asset data...</div>
      </AppShell>
    );
  }

  if (!asset) {
    return (
      <AppShell>
        <PageHeader title="Asset not found" subtitle="This asset is not in your library." />
        <Link to="/assets" className="btn-base btn-primary">
          Back to My Assets
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.type} · Registration ID ${asset.id} · Creator ${creator} · Registered ${asset.registeredOn}`}
        action={<StatusBadge status={asset.status} />}
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? <Overview asset={asset} creator={creator} /> : null}
      {tab === "Permissions" ? (
        <PermissionsTab assetId={asset.id} userId={session?.id ?? ""} />
      ) : null}
      {tab === "Sharing" ? <SharingTab assetId={asset.id} userId={session?.id ?? ""} /> : null}
      {tab === "Provenance" ? <ProvenanceTab asset={asset} /> : null}
      {tab === "Certificate" ? (
        <CertificateTab asset={asset} creator={creator} userId={session?.id ?? ""} />
      ) : null}
    </AppShell>
  );
}

function Overview({ asset, creator }: { asset: Asset; creator: string }) {
  const dna = [
    {
      label: "Exact SHA-256 Hash",
      value: asset.dna?.exactHash ? `${asset.dna.exactHash.slice(0, 16)}...` : "Verified",
      full: asset.dna?.exactHash,
      icon: Fingerprint,
    },
    {
      label: "Perceptual Fingerprint",
      value: asset.dna?.perceptualHash || "Verified",
      full: asset.dna?.perceptualHash,
      icon: Dna,
    },
    {
      label: "AI Permission Token",
      value: asset.dna?.aiPermissionToken || "Active",
      full: asset.dna?.aiPermissionToken,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-2 text-base font-bold">Asset Information</h2>
        <DetailRow label="Asset Name" value={asset.name} />
        <DetailRow label="Asset Type" value={asset.type} />
        <DetailRow label="Registration ID" value={<span className="font-mono">{asset.id}</span>} />
        <DetailRow label="Creator" value={creator} />
        <DetailRow label="Registered On" value={asset.registeredOn} />
        <DetailRow label="Description" value={asset.description || "—"} />
        <DetailRow label="Project / Collection" value={asset.collection || "—"} />
        <DetailRow
          label="Attached File"
          value={asset.fileName ? `${asset.fileName} (${asset.fileSize})` : "—"}
        />
        <DetailRow label="Status" value={<StatusBadge status={asset.status} />} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Animation Asset DNA</h2>
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 font-mono text-[0.68rem] font-bold text-success">
            Verified
          </span>
        </div>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Cryptographic and perceptual fingerprints with AI permission token.
        </p>

        <div className="divide-y divide-border">
          {dna.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-accent" />
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground" title={item.full}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PermissionsTab({ assetId, userId }: { assetId: string; userId: string }) {
  const initial = getPermissions(assetId);
  const [general, setGeneral] = useState<Record<string, boolean>>(initial.general);
  const [ai, setAi] = useState<Record<string, boolean>>(initial.ai);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await savePermissions(userId, assetId, { general, ai });
    setSaved(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-2 text-base font-bold">General Usage Permissions</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Define commercial rights and derivative authorizations for human workflows.
        </p>
        {Object.keys(general).map((k) => (
          <Toggle
            key={k}
            label={k}
            checked={general[k] ?? false}
            onChange={(v) => {
              setGeneral({ ...general, [k]: v });
              setSaved(false);
            }}
          />
        ))}
      </Card>

      <Card>
        <h2 className="mb-2 text-base font-bold">AI Usage &amp; Consent Permissions</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Machine-readable rules encoded into the asset&apos;s AI Permission Token.
        </p>
        {Object.keys(ai).map((k) => (
          <Toggle
            key={k}
            label={k}
            checked={ai[k] ?? false}
            onChange={(v) => {
              setAi({ ...ai, [k]: v });
              setSaved(false);
            }}
          />
        ))}
        <div className="mt-6 space-y-3">
          {saved ? <Alert tone="success">Permissions Updated &amp; Provenance Logged</Alert> : null}
          <button className="btn-base btn-primary w-full sm:w-auto" onClick={handleSave}>
            Save Permissions
          </button>
        </div>
      </Card>
    </div>
  );
}

function SharingTab({ assetId, userId }: { assetId: string; userId: string }) {
  const shares = getShares(assetId, userId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState("View Only");
  const [expiry, setExpiry] = useState("7 Days");
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please enter the recipient name and email.");
      return;
    }

    const created = await addShare(userId, assetId, {
      name: name.trim(),
      email: email.trim(),
      access,
      expiry,
    });

    setLink(`toonproof.app/share/${assetId.replace("-", "")}-${created.shareCode}`);
    setCopied(false);
    setName("");
    setEmail("");
    setOpen(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Controlled Sharing</h2>
            <p className="text-sm text-muted-foreground">
              Share this asset with a studio, client or collaborator with time-limited permissions.
            </p>
          </div>
          <button className="btn-base btn-primary" onClick={() => setOpen((v) => !v)}>
            <Share2 className="size-4" />
            Share Asset
          </button>
        </div>

        {open ? (
          <form onSubmit={generate} className="mt-5 space-y-4 border-t border-border pt-5">
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient Name">
                <input
                  className="field-input"
                  placeholder="e.g. BrightFrame Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Recipient Email">
                <input
                  type="email"
                  className="field-input"
                  placeholder="contact@brightframe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Access Level">
                <select
                  className="field-input"
                  value={access}
                  onChange={(e) => setAccess(e.target.value)}
                >
                  <option>View Only</option>
                  <option>View &amp; Download</option>
                </select>
              </Field>
              <Field label="Access Expiry">
                <select
                  className="field-input"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                >
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>No Expiry</option>
                </select>
              </Field>
            </div>
            <button type="submit" className="btn-base btn-primary">
              Generate Secure Share Link
            </button>
          </form>
        ) : null}

        {link ? (
          <div className="mt-5 rounded-lg bg-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active Share Link
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold">{link}</p>
            <button className="btn-base btn-outline mt-3" onClick={copy}>
              {copied ? "Copied to Clipboard!" : "Copy Link"}
            </button>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-bold">Sharing History &amp; Access Control</h2>
        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground">This asset has not been shared yet.</p>
        ) : null}
        <div className="grid gap-3">
          {shares.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Access: {s.access} · Expiry: {s.expiry} · Shared on {s.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={s.status} />
                {s.status === "Active" ? (
                  <button
                    className="btn-base btn-outline text-xs"
                    onClick={() => revokeShare(userId, s.id)}
                  >
                    Revoke Access
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProvenanceTab({ asset }: { asset: Asset }) {
  const events = getProvenance(asset);

  return (
    <Card className="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-base font-bold">Provenance History</h2>
          <p className="text-xs text-muted-foreground">
            Timestamped record of asset registration, fingerprinting, permissions, sharing and certificate events.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{events.length} Events</span>
      </div>

      <ol className="relative mt-6 border-l border-border pl-6 space-y-6">
        {events.map((p) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-[30.5px] mt-1 size-2.5 rounded-full bg-accent ring-4 ring-background" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.7rem] font-semibold text-muted-foreground">
                {p.date}
              </span>
              {p.hashSnippet ? (
                <span className="font-mono text-[0.65rem] text-accent">
                  [{p.hashSnippet}]
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{p.event}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function CertificateTab({
  asset,
  creator,
  userId,
}: {
  asset: Asset;
  creator: string;
  userId: string;
}) {
  const [message, setMessage] = useState("");
  const cert = getCertificate(asset.id, userId);
  const certId = certIdFor(asset.id);
  const p = getPermissions(asset.id);
  const commercial = !!p.general["Commercial Production"];
  const derivative = !!p.general["Derivative Creation"];
  const aiTraining = !!p.ai["Public AI Training"] || !!p.ai["Private AI Fine-Tuning"];
  const label = (v: boolean) => (v ? "Permitted" : "Not Permitted");

  async function handleIssue() {
    await issueCertificate(userId, asset.id);
    setMessage(cert ? `Certificate ${certId} is up to date.` : `Certificate ${certId} generated & verified.`);
  }

  function handleDownload() {
    if (!cert) {
      setMessage("Please generate the certificate first.");
      return;
    }
    downloadCertificate({
      certId,
      assetName: asset.name,
      creator,
      assetType: asset.type,
      assetId: asset.id,
      registrationDate: asset.registeredOn,
      issueDate: cert?.date,
      exactHash: asset.dna?.exactHash,
      perceptualHash: asset.dna?.perceptualHash,
      aiPermissionToken: asset.dna?.aiPermissionToken,
      commercial,
      derivative,
      aiTraining,
    });
    setMessage(`Certificate ${certId} downloaded successfully.`);
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-2xl">
        <div className="rounded-xl border border-border bg-secondary/30 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">TOONPROOF</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            IP &amp; Royalty Vault
          </p>
          <h2 className="mt-1 text-xl font-bold">Provenance Certificate</h2>
        </div>

        <div className="mt-5">
          <DetailRow label="Certificate ID" value={<span className="font-mono font-bold">{certId}</span>} />
          <DetailRow label="Asset Name" value={asset.name} />
          <DetailRow label="Creator" value={creator} />
          <DetailRow label="Asset Type" value={asset.type} />
          <DetailRow label="Registration ID" value={<span className="font-mono">{asset.id}</span>} />
          <DetailRow label="Registration Date" value={asset.registeredOn} />
          <DetailRow
            label="Cryptographic SHA-256"
            value={<span className="font-mono text-xs">{asset.dna?.exactHash ? `${asset.dna.exactHash.slice(0, 18)}...` : "Verified"}</span>}
          />
          <DetailRow label="Provenance Status" value={<StatusBadge status="Registered" />} />
          <DetailRow label="Commercial Production" value={<StatusBadge status={label(commercial)} />} />
          <DetailRow label="Derivative Creation" value={<StatusBadge status={label(derivative)} />} />
          <DetailRow label="AI Training Authorization" value={<StatusBadge status={label(aiTraining)} />} />
          <DetailRow
            label="Certificate Status"
            value={<StatusBadge status={cert ? "Valid" : "Not Generated"} />}
          />
          {cert ? <DetailRow label="Issued On" value={cert.date} /> : null}
        </div>

        {message ? (
          <div className="mt-4">
            <Alert tone="success">{message}</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button className="btn-base btn-primary" onClick={handleIssue}>
            <FileCheck2 className="size-4" />
            {cert ? "Update Certificate" : "Generate Certificate"}
          </button>
          <button className="btn-base btn-outline" onClick={handleDownload}>
            Download Official Certificate (.html)
          </button>
        </div>
      </Card>
    </div>
  );
}
