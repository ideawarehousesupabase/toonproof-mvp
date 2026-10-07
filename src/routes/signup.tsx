import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Alert, Field } from "@/components/ui-kit";
import { CREATOR_TYPES, createUser, type CreatorType } from "@/lib/users";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — ToonProof" },
      {
        name: "description",
        content:
          "Create your ToonProof creator account to register and protect animation assets.",
      },
      { property: "og:title", content: "Create Account — ToonProof" },
      {
        property: "og:description",
        content:
          "Create your ToonProof creator account to register and protect animation assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatorType, setCreatorType] = useState<CreatorType>("Animator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        creatorType,
      });

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully. Initializing your secure vault...");
      setTimeout(() => navigate({ to: "/dashboard" }), 600);
    } catch (err: any) {
      setError(err?.message || "Failed to create account.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your creator account"
      subtitle="Start registering, fingerprinting and protecting your animation work."
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}

        <Field label="Full Name">
          <input
            className="field-input"
            placeholder="e.g. Surya Sai"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            placeholder="animator@studio.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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

        <button type="submit" disabled={loading} className="btn-base btn-primary w-full">
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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
      <div className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center">
        <div className="w-full max-w-md">
          <div className="card-surface p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
