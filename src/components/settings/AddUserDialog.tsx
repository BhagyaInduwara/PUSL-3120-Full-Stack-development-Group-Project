"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { UserRole } from "@/domain/User";

interface AddUserDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

/** AddUserDialog — posts straight to /api/users (never touches ERPStore/UserRepository from the client); the password never leaves this form except in that one request body. */
export function AddUserDialog({ onClose, onCreated }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create the user.");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      title="Add user"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={submitting || username.trim().length < 3 || password.length < 6}
            onClick={handleSubmit}
          >
            {submitting ? "Adding…" : "Add user"}
          </Button>
        </>
      }
    >
      <Field label="Username">
        <Input placeholder="e.g. jsmith" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Role">
        <SegmentedControl<UserRole>
          name="role"
          value={role}
          onChange={setRole}
          options={[
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" },
          ]}
        />
      </Field>
      {error && (
        <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </div>
      )}
    </Dialog>
  );
}
