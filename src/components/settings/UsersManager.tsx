"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { AddUserDialog } from "./AddUserDialog";
import { UserDetailDialog, type UserEditableFields } from "./UserDetailDialog";
import type { PublicUser } from "@/domain/User";

interface UsersManagerProps {
  users: PublicUser[];
  isAdmin: boolean;
}

const columns: Column<PublicUser>[] = [
  { header: "Username", cell: (u) => <span className="font-semibold capitalize">{u.username}</span> },
  {
    header: "Role",
    cell: (u) => <Tag variant={u.role === "admin" ? "accent" : "neutral"}>{u.role}</Tag>,
  },
  {
    header: "Created",
    cell: (u) => new Date(u.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    className: "text-[var(--color-neutral-500)]",
  },
];

/**
 * UsersManager — the interactive half of Settings > Users. The page itself
 * (settings/users/page.tsx) is a Server Component that fetches `users`
 * directly from UserRepository server-side; this client component only
 * ever sees the already-public {id, username, role, createdAt} shape —
 * password hashes never reach the browser. Non-admins see the list
 * read-only (server-checked in the page, not just a hidden button here).
 */
export function UsersManager({ users, isAdmin }: UsersManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSaveUser(patch: UserEditableFields) {
    if (!selectedUser) return;
    setSaveError(null);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error ?? "Couldn't save the user.");
        return;
      }
      setSelectedUser(null);
      router.refresh();
    } catch {
      setSaveError("Couldn't reach the server. Please try again.");
    }
  }

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-3">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            Add user
          </Button>
        </div>
      )}
      <Table columns={columns} rows={users} rowKey={(u) => u.id} onRowClick={setSelectedUser} />

      {dialogOpen && (
        <AddUserDialog
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}

      {selectedUser && (
        <UserDetailDialog
          user={selectedUser}
          isAdmin={isAdmin}
          onClose={() => {
            setSelectedUser(null);
            setSaveError(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {saveError && selectedUser && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {saveError}
        </div>
      )}
    </>
  );
}
