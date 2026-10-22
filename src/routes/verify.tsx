import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, FileSearch, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { AssetThumb } from "@/components/AssetThumb";
import { Alert, DetailRow } from "@/components/ui-kit";
import { computeFileSha256 } from "@/lib/processing-engine";
import type { Asset, Certificate } from "@/lib/types";
import { lookupCertificate } from "@/lib/vault";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    const id = search["id"];
    return typeof id === "string" && id.trim() ? { id: id.trim() } : {};
  },
  head: () => ({
    meta: [
      { title: "Verify Certificate — ToonProof" },
      {
        name: "description",
        content:
          "Check that a ToonProof provenance certificate is genuine, see its registered owner and compare a file against it.",
      },
      { property: "og:title", content: "Verify Certificate — ToonProof" },
      {
        property: "og:description",
        content:
          "Check that a ToonProof provenance certificate is genuine, see its registered owner and compare a file against it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyCertificate,
});

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not-found"; id: string }
  | { status: "error" }
  | { status: "found"; cert: Certificate; asset: Asset | undefined };

function VerifyCertificate() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [certId, setCertId] = useState(search.id ?? "");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });

  async function run(id: string) {
    const clean = id.trim().toUpperCase();
    if (!clean) return;
    setLookup({ status: "loading" });
    try {
      const result = await lookupCertificate(clean);
      setLookup(result ? { status: "found", ...result } : { status: "not-found", id: clean });
    } catch {
      setLookup({ status: "error" });
    }
  }

  useEffect(() => {
    if (search.id) {
      setCertId(search.id);
      void run(search.id);
    }
  }, [search.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = certId.trim().toUpperCase();
    if (!clean) return;
    if (clean === search.id?.toUpperCase()) void run(clean);
    else navigate({ to: "/verify", search: { id: clean } });
  }

  return (
    <div className="flex min-h-screen flex-col bg-sidebar">
      <div className="px-4 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-accent">
            <ShieldCheck className="size-4 text-accent-foreground" />
          </span>
          <span className="font-bold tracking-tight text-sidebar-foreground">ToonProof</span>
        </Link>
      </div>
      <div className="flex flex-1 justify-center px-4 pb-12">
        <div className="w-full max-w-2xl space-y-4">
          <div className="card-surface p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight">Verify a Certificate</h1>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Check that a ToonProof provenance certificate is genuine and see who registered the
              asset.
            </p>
            <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
              <input
                className="field-input font-mono uppercase"
                placeholder="Certificate ID, e.g. TPC-10002"
                aria-label="Certificate ID"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
              />
              <button type="submit" className="btn-base btn-primary shrink-0">
                <FileSearch className="size-4" />
                Verify
              </button>
            </form>
          </div>

          {lookup.status === "loading" ? (
            <div className="card-surface flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-accent" />
              Checking the ToonProof registry...
            </div>
          ) : null}

          {lookup.status === "not-found" ? (
            <div className="card-surface p-6">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="size-5" />
                <h2 className="text-base font-bold">No certificate found</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                There is no certificate with the ID <span className="font-mono">{lookup.id}</span>{" "}
                in the ToonProof registry. It may have been deleted by its owner, or the ID is
                wrong. A downloaded certificate file is not proof on its own &mdash; only
                certificates listed here are genuine.
              </p>
            </div>
          ) : null}

          {lookup.status === "error" ? (
            <Alert tone="error">Couldn&rsquo;t reach the registry. Please try again.</Alert>
          ) : null}

          {lookup.status === "found" ? <CertificateResult cert={lookup.cert} asset={lookup.asset} /> : null}

          <HowOwnershipWorks />
        </div>
      </div>
    </div>
  );
}

function CertificateResult({ cert, asset }: { cert: Certificate; asset: Asset | undefined }) {
  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 text-success">
        <BadgeCheck className="size-5" />
        <h2 className="text-base font-bold">Genuine ToonProof certificate</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        This certificate exists in the ToonProof registry and is valid.
      </p>

      {asset ? (
        <AssetThumb
          src={asset.thumbnail}
          fileName={asset.fileName}
          mimeType={asset.fileMimeType}
          alt={`Preview of ${asset.name}`}
          size="lg"
          className="mt-5"
          emptyText="No preview image registered"
        />
      ) : null}

      <div className="mt-4">
        <DetailRow label="Certificate ID" value={<span className="font-mono font-bold">{cert.id}</span>} />
        <DetailRow label="Asset Name" value={asset?.name ?? "—"} />
        <DetailRow label="Asset Type" value={asset?.type ?? "—"} />
        <DetailRow label="Registered By" value={cert.ownerName || "ToonProof creator account"} />
        <DetailRow label="Owner Account" value={cert.ownerEmail || "—"} />
        <DetailRow label="Registration ID" value={<span className="font-mono">{cert.assetId}</span>} />
        <DetailRow label="Registration Date" value={asset?.registeredOn ?? "—"} />
        <DetailRow label="Certificate Issued" value={cert.date} />
        <DetailRow
          label="Source File"
          value={asset?.fileName ? `${asset.fileName} (${asset.fileSize})` : "—"}
        />
        <DetailRow
          label="SHA-256 Fingerprint"
          value={
            <span className="break-all font-mono text-xs">
              {asset?.dna?.exactHash ?? cert.hashSignature}
            </span>
          }
        />
      </div>

      {asset ? <FileCheck asset={asset} /> : null}
    </div>
  );
}

function FileCheck({ asset }: { asset: Asset }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "checking"; name: string }
    | { status: "match" | "mismatch"; name: string }
    | { status: "error" }
  >({ status: "idle" });

  if (!asset.hashedFromFile) {
    return (
      <p className="mt-5 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground">
        This certificate was issued before file fingerprinting, so files can&rsquo;t be compared
        against it.
      </p>
    );
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setState({ status: "checking", name: f.name });
    const hash = await computeFileSha256(f);
    if (!hash) {
      setState({ status: "error" });
      return;
    }
    setState({ status: hash === asset.dna.exactHash ? "match" : "mismatch", name: f.name });
  }

  return (
    <div className="mt-5 rounded-xl border border-border p-4">
      <h3 className="text-sm font-bold">Check a file against this certificate</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The file is checked in your browser and never uploaded. Only the exact original file
        produces the registered SHA-256 fingerprint.
      </p>
      <button
        type="button"
        className="btn-base btn-outline mt-3 text-xs"
        disabled={state.status === "checking"}
        onClick={() => input.current?.click()}
      >
        <FileSearch className="size-3.5" />
        Choose File to Check
      </button>
      <input ref={input} type="file" className="hidden" onChange={pick} />

      {state.status === "checking" ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-accent" />
          Fingerprinting {state.name}...
        </p>
      ) : null}
      {state.status === "match" ? (
        <div className="mt-3">
          <Alert tone="success">
            Match &mdash; &ldquo;{state.name}&rdquo; is identical to the registered original.
          </Alert>
        </div>
      ) : null}
      {state.status === "mismatch" ? (
        <div className="mt-3">
          <Alert tone="error">
            No match &mdash; &ldquo;{state.name}&rdquo; is not the file registered with this
            certificate.
          </Alert>
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="mt-3">
          <Alert tone="error">Couldn&rsquo;t read that file. Please try again.</Alert>
        </div>
      ) : null}
    </div>
  );
}

function HowOwnershipWorks() {
  return (
    <div className="card-surface p-6 text-sm">
      <h2 className="text-base font-bold">How ownership is proven</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>
          A certificate is genuine only if it appears on this page. Names and downloaded
          certificate files can be copied; the registry entry can&rsquo;t.
        </li>
        <li>
          Each certificate is tied to the account that registered the asset, with the date it was
          registered.
        </li>
        <li>
          The SHA-256 fingerprint is calculated from the original file. Only someone holding that
          exact file can show a match above.
        </li>
      </ul>
    </div>
  );
}
