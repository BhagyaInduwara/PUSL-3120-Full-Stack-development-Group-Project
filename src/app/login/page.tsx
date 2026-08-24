"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/apiUrl";

/**
 * Login & Registration page — outside the (app) route group, so it renders without the
 * Sidebar shell. Posts credentials twice on submit: once to /api/auth/login (or /register),
 * which proxies to the Express backend and sets a cookie scoped to *this* (frontend) domain
 * — that's what proxy.ts middleware checks to gate routes — and once directly to the backend
 * from the browser, so it also sets its own cookie on *its* domain, which every page's
 * client-side data fetches need since they call the backend directly with credentials:
 * "include". Cookies don't cross domains, so one login response can't cover both; when
 * frontend and backend happen to share an origin (local dev), the second call is harmless
 * and redundant rather than necessary. On success, redirects to /dashboard.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const [res, backendRes] = await Promise.all([
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }),
        fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        }),
      ]);
      const data = await res.json();

      if (!res.ok || !backendRes.ok) {
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

  function toggleMode() {
    setError(null);
    setMode((prev) => (prev === "login" ? "register" : "login"));
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-8 h-8 flex-none rounded-lg bg-[var(--color-accent-800)] text-[var(--color-accent-200)] flex items-center justify-center font-[family-name:var(--font-heading)] font-semibold text-base">
            F
          </div>
          <span className="font-[family-name:var(--font-heading)] font-medium text-xl tracking-tight text-[var(--color-text)]">
            FlowERP
          </span>
        </div>

        <Card elevation="md" className="gap-5 p-7">
          <div>
            <CardTitle className="text-xl">{isLogin ? "Sign in" : "Create account"}</CardTitle>
            <div className="text-[13px] text-[var(--color-neutral-500)] mt-1">
              {isLogin
                ? "Enter your username and password to continue."
                : "Enter a username and password to register a new account."}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Username">
              <Input
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jdoe"
                minLength={3}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={isLogin ? 1 : 6}
                required
              />
            </Field>

            {error && (
              <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" block disabled={submitting}>
              {submitting
                ? isLogin
                  ? "Signing in…"
                  : "Creating account…"
                : isLogin
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          <div className="pt-2 border-t border-[var(--color-divider)] text-center text-[13px] text-[var(--color-neutral-500)]">
            {isLogin ? (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
