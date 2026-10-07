import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, Field } from "@/components/ui-kit";
import { findUserByCredentials } from "@/lib/users";
import { AuthLayout } from "./signup";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — ToonProof" },
      {
        name: "description",
        content: "Sign in to your ToonProof vault to manage registered animation assets.",
      },
      { property: "og:title", content: "Sign In — ToonProof" },
      {
        property: "og:description",
        content: "Sign in to your ToonProof vault to manage registered animation assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await findUserByCredentials(email, password);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Failed to sign in.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to ToonProof"
      subtitle="Access your creator vault, asset DNA records and certificates."
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}

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

        <button type="submit" disabled={loading} className="btn-base btn-primary w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-accent hover:underline">
          Create Account
        </Link>
      </p>
    </AuthLayout>
  );
}
