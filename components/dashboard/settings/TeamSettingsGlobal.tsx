"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TeamSettingsGlobal() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">(
    "viewer"
  );
  const [inviting, setInviting] = useState(false);
  const [teamMembers] = useState([
    {
      _id: "1",
      email: "user@example.com",
      name: "John Doe",
      role: "admin" as const,
      status: "accepted" as const,
    },
  ]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      return;
    }
    setInviting(true);
    // TODO: Implement invite functionality
    setTimeout(() => {
      setInviteEmail("");
      setInviteRole("viewer");
      setInviting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-stone-200 rounded-2xl bg-stone-0">
        <CardHeader>
          <CardTitle>Invite Team Members</CardTitle>
          <CardDescription>
            Invite team members to collaborate on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Select
              value={inviteRole}
              onValueChange={(value) =>
                setInviteRole(value as "viewer" | "editor" | "admin")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviting} size="sm">
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-stone-200 rounded-2xl bg-stone-0">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              No team members yet. Invite someone to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.name || member.email.split("@")[0]}
                        </span>
                        <span className="text-xs text-stone-500">
                          {member.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-800 uppercase">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 uppercase">
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
