import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useRequireSession } from "@/components/AppShell";
import { Alert, Card, DetailRow, Field, PageHeader } from "@/components/ui-kit";
import {
  CREATOR_TYPES,
  deleteUser,
  getUserById,
  updateUser,
  type CreatorType,
  type User,
} from "@/lib/users";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ToonProof" },
      {
        name: "description",
        content: "Manage your ToonProof creator profile details and account.",
      },
      { property: "og:title", content: "Profile — ToonProof" },
      {
        property: "og:description",
        content: "Manage your ToonProof creator profile details and account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const { session } = useRequireSession();
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [creatorType, setCreatorType] = useState<CreatorType>("Animator");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!session) return;
    const current = getUserById(session.id);
    if (current) {
      setUser(current);
      setFullName(current.fullName);
      setCreatorType(current.creatorType);
    }
  }, [session]);

  async function save() {
    if (!user || !fullName.trim()) {
      setMessage("");
      return;
    }
    const updated = await updateUser(user.id, { fullName: fullName.trim(), creatorType });
    if (updated) {
      setUser(updated);
      setEditing(false);
      setMessage("Profile updated successfully.");
    }
  }

  async function remove() {
    if (!user) return;
    await deleteUser(user.id);
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your creator account and authentication details." />
      {message ? (
        <div className="mb-4">
          <Alert tone="success">{message}</Alert>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          {!editing ? (
            <>
              <DetailRow label="Full Name" value={user?.fullName ?? "—"} />
              <DetailRow label="Email" value={user?.email ?? "—"} />
              <DetailRow label="Creator Type" value={user?.creatorType ?? "—"} />
              <DetailRow
                label="Account Created"
                value={
                  user
                    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <button className="btn-base btn-primary mt-5" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <Field label="Full Name">
                <input
                  className="field-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
              <Field label="Email" hint="Email is fixed to your identity.">
                <input className="field-input opacity-60" value={user?.email ?? ""} readOnly />
              </Field>
              <Field label="Creator Type">
                <select
                  className="field-input"
                  value={creatorType}
                  onChange={(e) => setCreatorType(e.target.value as CreatorType)}
                >
                  {CREATOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2">
                <button className="btn-base btn-primary" onClick={save}>
                  Save Changes
                </button>
                <button className="btn-base btn-outline" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-bold">Delete Creator Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This permanently removes your account details and stored session. This action cannot be undone.
          </p>
          <button className="btn-base btn-danger mt-5" onClick={() => setConfirming(true)}>
            Delete Account
          </button>
        </Card>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-primary/50 px-4">
          <div className="card-surface w-full max-w-sm p-6">
            <h3 className="text-base font-bold">Delete your account?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account details will be deleted and you will be signed out immediately.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-base btn-outline" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className="btn-base btn-danger" onClick={remove}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
