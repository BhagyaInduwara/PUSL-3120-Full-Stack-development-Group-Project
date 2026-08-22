"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Login page — outside the (app) route group, so it renders without the
 * Sidebar shell (see src/app/layout.tsx). Posts credentials to
 * /api/auth/login, which verifies them against UserRepository and sets the
 * session cookie; on success this just navigates to /dashboard and lets
 * middleware.ts + (app)/layout.tsx take over from there.
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-8 h-8 flex-none rounded-lg bg-[var(--color-accent-800)] text-[var(--color-accent-200)] flex items-center justify-center font-[family-name:var(--font-heading)] font-semibold text-base">
            F
          </div>
          <span className="font-[family-name:var(--font-heading)] font-medium text-xl tracking-tight">
            FlowERP
          </span>
        </div>

        <Card elevation="md" className="gap-5 p-7">
          <div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <div className="text-[13px] text-[var(--color-neutral-500)] mt-1">
              Enter your username and password to continue.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Username">
              <Input
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && (
              <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" block disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
