import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, Field } from "@/components/ui-kit";
import { resetPassword } from "@/lib/users";
import { AuthLayout } from "./signup";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — ToonProof" },
      {
        name: "description",
        content: "Set a new password for your ToonProof creator account.",
      },
      { property: "og:title", content: "Reset Password — ToonProof" },
      {
        property: "og:description",
        content: "Set a new password for your ToonProof creator account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email, password);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setSuccess("Password updated. Taking you to sign in...");
      setTimeout(() => navigate({ to: "/login" }), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Failed to reset password.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you registered with and choose a new password."
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}

        <Field label="Email Address">
          <input
            type="email"
            placeholder="animator@studio.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="New Password">
          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Confirm New Password">
          <input
            type="password"
            placeholder="••••••••"
            className="field-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="btn-base btn-primary w-full"
        >
          {loading ? "Updating Password..." : "Update Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
