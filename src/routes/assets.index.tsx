import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Card, PageHeader, StatusBadge } from "@/components/ui-kit";
import { FILTERS, matchesFilter, type Filter } from "@/lib/mock";
import { getAssets, useVault } from "@/lib/vault";
import { FolderLock, PlusCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/assets/")({
  head: () => ({
    meta: [
      { title: "My Assets — ToonProof" },
      {
        name: "description",
        content:
          "Your library of registered animation assets with registration IDs and status.",
      },
      { property: "og:title", content: "My Assets — ToonProof" },
      {
        property: "og:description",
        content:
          "Your library of registered animation assets with registration IDs and status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyAssets,
});

function MyAssets() {
  const { session } = useRequireSession();
  const ready = useVault(session?.id);
  const [filter, setFilter] = useState<Filter>("All");

  const allUserAssets = ready && session ? getAssets(session.id) : [];
  const assets = allUserAssets.filter((a) => matchesFilter(a.type, filter));

  return (
    <AppShell>
      <PageHeader
        title="My Assets"
        subtitle="Every asset you have registered and protected."
        action={
          <Link to="/assets/new" className="btn-base btn-primary">
            <PlusCircle className="size-4" />
            Register New Asset
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {allUserAssets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <FolderLock className="size-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold">Your Vault is Empty</h3>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
            You have not registered any animation assets yet. Register your creative work to generate
            cryptographic fingerprints and provenance proof.
          </p>
          <Link to="/assets/new" className="btn-base btn-primary mt-6">
            <Sparkles className="size-3.5" />
            Register New Asset
          </Link>
        </Card>
      ) : assets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No assets found in the &ldquo;{filter}&rdquo; category.
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card-surface hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Asset Name</th>
                  <th className="px-5 py-3 font-semibold">Asset Type</th>
                  <th className="px-5 py-3 font-semibold">Registration ID</th>
                  <th className="px-5 py-3 font-semibold">Registration Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3 font-semibold">
                      <Link
                        to="/assets/$assetId"
                        params={{ assetId: a.id }}
                        className="hover:text-accent font-semibold"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a.type}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.registeredOn}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/assets/$assetId"
                        params={{ assetId: a.id }}
                        className="btn-base btn-outline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="grid gap-3 md:hidden">
            {assets.map((a) => (
              <Link
                key={a.id}
                to="/assets/$assetId"
                params={{ assetId: a.id }}
                className="card-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-muted-foreground">{a.type}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    {a.id} · {a.registeredOn}
                  </p>
                  <span className="btn-base btn-outline">View</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
