"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { addAdmin, removeAdmin } from "@/features/admin-admins/actions";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  clerkUserId: string | null;
}

export function AdminsManager({ admins, currentProfileId }: { admins: AdminRow[]; currentProfileId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [removeTarget, setRemoveTarget] = useState<AdminRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await addAdmin({ email });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setPending(true);
    const result = await removeAdmin(removeTarget.id);
    setPending(false);
    setRemoveTarget(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="email">New administrator email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@up.edu.mx"
            required
          />
        </div>
        <Button type="submit" loading={pending}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium text-gray-900">{admin.name}</TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <Badge tone={admin.clerkUserId ? "green" : "gray"}>
                  {admin.clerkUserId ? "Active" : "Pending first login"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {admin.id !== currentProfileId && (
                    <IconButton
                      label="Remove administrator"
                      icon={Trash2}
                      tone="danger"
                      onClick={() => setRemoveTarget(admin)}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove administrator"
        description={`Remove "${removeTarget?.name}" as an administrator? Their account will become a student account.`}
        destructive
        loading={pending}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
