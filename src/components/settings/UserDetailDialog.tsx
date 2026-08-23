"use client";

import { useState } from "react";
import type { PublicUser, UserRole } from "@/domain/User";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { Tag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export interface UserEditableFields {
  username: string;
  role: UserRole;
  /** Only sent (and only re-hashed server-side) when non-empty — leaving it blank keeps the current password. */
  password?: string;
}

interface UserDetailDialogProps {
  user: PublicUser;
  /** Only admins can open this in edit mode — everyone else sees a read-only view (server also enforces this on PUT). */
  isAdmin: boolean;
  onClose: () => void;
  onSave: (patch: UserEditableFields) => void;
}

/** UserDetailDialog — popup opened from the Users table, same shell as every other settings entity. */
export function UserDetailDialog({ user, isAdmin, onClose, onSave }: UserDetailDialogProps) {
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState<UserRole>(user.role);
  const [password, setPassword] = useState("");

  const reset = () => {
    setUsername(user.username);
    setRole(user.role);
    setPassword("");
  };

  return (
    <RecordDialog
      title={user.username}
      subtitle="User"
      editable={isAdmin}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ username, role, password: password || undefined })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Username" value={user.username} />
            <RecordRow label="Role" value={<Tag variant={user.role === "admin" ? "accent" : "neutral"}>{user.role}</Tag>} />
            <RecordRow
              label="Created"
              value={new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
          </>
        ) : (
          <>
            <Field label="Username">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </Field>
            <Field label="Role">
              <SegmentedControl<UserRole>
                name="edit-role"
                value={role}
                onChange={setRole}
                options={[
                  { value: "staff", label: "Staff" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
