import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Alert, Card, PageHeader, StatusBadge } from "@/components/ui-kit";
import { getPermissions, listCertificates, useVault } from "@/lib/vault";
import { downloadCertificate } from "@/lib/certificate";
import { FileBadge, Download, ArrowRight } from "lucide-react";

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
  const [message, setMessage] = useState("");
  const certs = ready && session ? listCertificates(session.id) : [];

  return (
    <AppShell>
      <PageHeader
        title="Certificates"
        subtitle="Provenance certificates and tamper-evident proof records for your protected assets."
      />

      {message ? (
        <div className="mb-4">
          <Alert tone="success">{message}</Alert>
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
          <div
            key={c.id}
            className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-foreground">{c.asset.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {c.id} · Issued {c.date} · {c.asset.type}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                    creator: session?.fullName ?? "Creator",
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
                  });
                  setMessage(`Certificate ${c.id} downloaded successfully.`);
                }}
              >
                <Download className="size-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
