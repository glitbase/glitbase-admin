import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Copy, RotateCw, Trash2, Check } from "lucide-react";
import {
  EmptyState,
  TableSkeleton,
  StatusBadge,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getInvites,
  resendInvite,
  revokeInvite,
} from "@/services/invitesApi";
import type { Invite } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { copyInviteLink } from "@/components/users/CreateInviteSheet";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInviterName(invite: Invite) {
  const { invitedBy } = invite;
  if (invitedBy.firstName || invitedBy.lastName) {
    return `${invitedBy.firstName ?? ""} ${invitedBy.lastName ?? ""}`.trim();
  }
  return invitedBy.email;
}

export function InvitesPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingInvite, setRevokingInvite] = useState<Invite | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: () => getInvites({ limit: 100 }),
    retry: 1,
  });

  const invites: Invite[] = (data?.data?.invites || []).map((invite) => {
    const row = invite as Invite & { _id?: string; uses?: number };
    return {
      ...invite,
      id: invite.id || row._id || "",
      usedCount: invite.usedCount ?? row.uses ?? 0,
      expiresAt: new Date(invite.expiresAt),
      createdAt: new Date(invite.createdAt),
      updatedAt: new Date(invite.updatedAt),
    };
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading invites",
        description: error instanceof Error ? error.message : "Failed to fetch invites",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const resendMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => {
      toast({ title: "Invite resent", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error resending invite",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      toast({ title: "Invite revoked", variant: "success" });
      setRevokingInvite(null);
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error revoking invite",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = async (invite: Invite) => {
    const url = invite.inviteUrl;
    if (!url) {
      toast({
        title: "Link unavailable",
        description: "Create a new open invite to get a copyable link.",
        variant: "destructive",
      });
      return;
    }
    try {
      await copyInviteLink(url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Link copied", variant: "success" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <TableSkeleton columns={7} rows={8} />;
  }

  if (invites.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Mail className="h-10 w-10" />}
          title="No invites yet"
          description="Create an invite to onboard customers or providers via link or email"
        />
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="hidden lg:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Uses</th>
                <th>Invited by</th>
                <th className="text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td>
                    {invite.email || (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        Open link
                      </span>
                    )}
                  </td>
                  <td className="capitalize">{invite.role}</td>
                  <td>
                    <StatusBadge status={invite.status} />
                  </td>
                  <td className="text-muted-foreground">{formatDate(invite.expiresAt)}</td>
                  <td>
                      {invite.usedCount}/{invite.maxUses}
                  </td>
                  <td className="text-muted-foreground text-sm">{getInviterName(invite)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyLink(invite)}
                        disabled={!invite.inviteUrl || invite.status === "revoked"}
                        title="Copy link"
                      >
                        {copiedId === invite.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {invite.email && invite.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => resendMutation.mutate(invite.id)}
                          disabled={resendMutation.isPending}
                          title="Resend"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      )}
                      {invite.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRevokingInvite(invite)}
                          title="Revoke"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden divide-y divide-border">
          {invites.map((invite) => (
            <div key={invite.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{invite.email || "Open invite link"}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {invite.role} · {invite.usedCount}/{invite.maxUses} uses · {formatDate(invite.createdAt)}
                  </p>
                </div>
                <StatusBadge status={invite.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(invite)}
                  disabled={!invite.inviteUrl || invite.status === "revoked"}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
                {invite.email && invite.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendMutation.mutate(invite.id)}
                    disabled={resendMutation.isPending}
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                    Resend
                  </Button>
                )}
                {invite.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setRevokingInvite(invite)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(revokingInvite)} onOpenChange={(open) => !open && setRevokingInvite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke invite?</DialogTitle>
            <DialogDescription>
              This will invalidate the invite for{" "}
              <strong>{revokingInvite?.email || "the open link"}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRevokingInvite(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={() => revokingInvite && revokeMutation.mutate(revokingInvite.id)}
            >
              {revokeMutation.isPending ? "Revoking…" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
