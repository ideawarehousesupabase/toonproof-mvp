import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Alert, Card, PageHeader, StatusBadge } from "@/components/ui-kit";
import {
  deleteCertificate,
  getPermissions,
  listCertificates,
  maskEmail,
  useVault,
} from "@/lib/vault";
import { downloadCertificate, verificationUrl } from "@/lib/certificate";
import { AssetThumb } from "@/components/AssetThumb";
import { FileBadge, Download, ArrowRight, FileSearch, Trash2 } from "lucide-react";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — ToonProof" },
      {
        name: "description",
        content: "Provenance certificates issued for your registered animation assets.",
      },
      { property: "og:title", content: "Certificates — ToonProof" },
      {
        property: "og:description",
        content: "Provenance certificates issued for your registered animation assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Certificates,
});

function Certificates() {
  const { session } = useRequireSession();
  const ready = useVault(session?.id);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const certs = ready && session ? listCertificates(session.id) : [];

  async function remove(certId: string) {
    if (!session) return;
    setDeletingId(certId);
    try {
      await deleteCertificate(session.id, certId);
      setMessage({ tone: "success", text: `Certificate ${certId} deleted.` });
    } catch (err: unknown) {
      setMessage({
        tone: "error",
        text: err instanceof Error && err.message ? err.message : "Couldn't delete the certificate.",
      });
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Certificates"
        subtitle="Provenance certificates and tamper-evident proof records for your protected assets."
        action={
          <Link to="/verify" className="btn-base btn-outline">
            <FileSearch className="size-4" />
            Verify a Certificate
          </Link>
        }
      />

      {message ? (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      ) : null}

      <div className="grid gap-3">
        {ready && certs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <FileBadge className="size-6" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold">No certificates generated yet</h3>
            <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
              Provenance certificates prove ownership and declared AI rights for client delivery and festivals.
              Open any registered asset and click &ldquo;Generate Certificate&rdquo; on its Certificate tab.
            </p>
            <Link to="/assets" className="btn-base btn-primary mt-6">
              Go to My Assets
              <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        ) : null}

        {certs.map((c) => (
          <div key={c.id} className="card-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <AssetThumb
                  src={c.asset.thumbnail}
                  fileName={c.asset.fileName}
                  mimeType={c.asset.fileMimeType}
                  alt={`Preview of ${c.asset.name}`}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{c.asset.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {c.id} · Issued {c.date} · {c.asset.type}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="Valid" />
                <Link
                  to="/assets/$assetId"
                  params={{ assetId: c.assetId }}
                  search={{ tab: "Certificate" }}
                  className="btn-base btn-outline text-xs"
                >
                  View
                </Link>
                <button
                  className="btn-base btn-primary text-xs"
                  onClick={() => {
                    const p = getPermissions(c.assetId);
                    downloadCertificate({
                      certId: c.id,
                      assetName: c.asset.name,
                      creator: c.ownerName || session?.fullName || "Creator",
                      ownerEmail: c.ownerEmail || maskEmail(session?.email ?? ""),
                      verifyUrl: verificationUrl(c.id),
                      assetType: c.asset.type,
                      assetId: c.assetId,
                      registrationDate: c.asset.registeredOn,
                      issueDate: c.date,
                      exactHash: c.asset.dna?.exactHash,
                      perceptualHash: c.asset.dna?.perceptualHash,
                      aiPermissionToken: c.asset.dna?.aiPermissionToken,
                      commercial: !!p.general["Commercial Production"],
                      derivative: !!p.general["Derivative Creation"],
                      aiTraining: !!p.ai["Public AI Training"] || !!p.ai["Private AI Fine-Tuning"],
                      thumbnail: c.asset.thumbnail,
                      fileName: c.asset.fileName
                        ? `${c.asset.fileName} (${c.asset.fileSize})`
                        : undefined,
                      hashedFromFile: c.asset.hashedFromFile,
                    });
                    setMessage({ tone: "success", text: `Certificate ${c.id} downloaded successfully.` });
                  }}
                >
                  <Download className="size-3.5" />
                  Download
                </button>
                {confirmId !== c.id ? (
                  <button
                    className="btn-base btn-outline text-xs text-destructive"
                    aria-label={`Delete certificate ${c.id}`}
                    onClick={() => setConfirmId(c.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
            {confirmId === c.id ? (
              <div className="mt-3 flex flex-col gap-2.5 rounded-lg bg-destructive/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-destructive">
                  Delete certificate {c.id}? Its verification link will stop working.
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="btn-base btn-danger text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === c.id}
                    onClick={() => remove(c.id)}
                  >
                    {deletingId === c.id ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    className="btn-base btn-outline text-xs"
                    disabled={deletingId === c.id}
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
