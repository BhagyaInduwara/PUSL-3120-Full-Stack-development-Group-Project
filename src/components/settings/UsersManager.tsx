"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { AddUserDialog } from "./AddUserDialog";
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
  const router = useRouter();

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-3">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            Add user
          </Button>
        </div>
      )}
      <Table columns={columns} rows={users} rowKey={(u) => u.id} />

      {dialogOpen && (
        <AddUserDialog
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
