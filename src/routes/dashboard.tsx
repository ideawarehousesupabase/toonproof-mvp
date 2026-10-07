import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Card, PageHeader, StatusBadge } from "@/components/ui-kit";
import { getAssets, getStats, useVault } from "@/lib/vault";
import { PlusCircle, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ToonProof" },
      {
        name: "description",
        content:
          "Overview of your registered animation assets, shares and provenance certificates.",
      },
      { property: "og:title", content: "Dashboard — ToonProof" },
      {
        property: "og:description",
        content:
          "Overview of your registered animation assets, shares and provenance certificates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useRequireSession();
  const ready = useVault(session?.id);
  const stats = ready && session
    ? getStats(session.id)
    : { registered: 0, protected: 0, activeShares: 0, certificates: 0 };

  const STATS = [
    { label: "Registered Assets", value: stats.registered },
    { label: "Protected Assets", value: stats.protected },
    { label: "Active Shares", value: stats.activeShares },
    { label: "Certificates", value: stats.certificates },
  ];

  const recent = ready && session ? getAssets(session.id).slice(0, 5) : [];

  return (
    <AppShell>
      <PageHeader
        title={session ? `Welcome back, ${session.fullName.split(" ")[0]}` : "Dashboard"}
        subtitle="Your registered assets and recent protection activity."
        action={
          <Link to="/assets/new" className="btn-base btn-primary">
            <PlusCircle className="size-4" />
            Register New Asset
          </Link>
        }
      />

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* RECENT ASSETS SECTION */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">Recent Assets</h2>
        {recent.length > 0 ? (
          <Link to="/assets" className="text-xs font-semibold text-accent hover:underline">
            View all ({stats.registered})
          </Link>
        ) : null}
      </div>

      {recent.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Shield className="size-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold">No assets registered yet</h3>
          <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
            Register your first character design, 2D rig, walk cycle, or animation sequence to generate
            cryptographic fingerprints, AI permission tokens, and provenance records.
          </p>
          <Link to="/assets/new" className="btn-base btn-primary mt-6">
            <Sparkles className="size-3.5" />
            Register Your First Asset
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {recent.map((a) => (
            <Link
              key={a.id}
              to="/assets/$assetId"
              params={{ assetId: a.id }}
              className="card-surface flex flex-col gap-2 p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <span className="text-sm text-muted-foreground">{a.registeredOn}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
