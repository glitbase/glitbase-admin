import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, MoreHorizontal, Crown, UserMinus } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateAdminSheet } from "@/components/admins/CreateAdminSheet";
import {
  getAdmins,
  updateAdmin,
  revokeAdmin,
  type GetAdminsParams,
} from "@/services/adminsApi";
import type { AdminTeamMember } from "@/types/api";
import { normalizePaginationMeta } from "@/lib/paginationUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function getAdminName(admin: AdminTeamMember) {
  const full = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim();
  return full || admin.email;
}

function getInvitedByName(invitedBy?: AdminTeamMember["invitedBy"]) {
  if (!invitedBy) return "—";
  const full = `${invitedBy.firstName ?? ""} ${invitedBy.lastName ?? ""}`.trim();
  return full || invitedBy.email;
}

function getAdminStatus(admin: AdminTeamMember) {
  if (admin.mustChangePassword) {
    return { status: "pending_setup" };
  }
  return { status: "active" };
}

function getAdminRoleLabel(admin: AdminTeamMember) {
  return admin.isSuperAdmin ? "Super admin" : "Admin";
}

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokingAdmin, setRevokingAdmin] = useState<AdminTeamMember | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    admin: AdminTeamMember;
    nextIsSuperAdmin: boolean;
  } | null>(null);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const queryParams: GetAdminsParams = useMemo(() => {
    const params: GetAdminsParams = { page, limit };
    if (debouncedSearch.trim()) params.searchTerm = debouncedSearch.trim();
    return params;
  }, [page, limit, debouncedSearch]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-team", queryParams],
    queryFn: () => getAdmins(queryParams),
    retry: 1,
  });

  const admins = useMemo(() => {
    return (data?.data?.admins || []).map((admin) => ({
      ...admin,
      createdAt: new Date(admin.createdAt),
    }));
  }, [data?.data?.admins]);

  const paginationMeta = useMemo(
    () => normalizePaginationMeta(data?.data?.meta, limit),
    [data?.data?.meta, limit]
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading admin team",
        description: error instanceof Error ? error.message : "Failed to fetch admins",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-team"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, isSuperAdmin }: { id: string; isSuperAdmin: boolean }) =>
      updateAdmin(id, { isSuperAdmin }),
    onSuccess: () => {
      toast({ title: "Admin updated", variant: "success" });
      setRoleChangeTarget(null);
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAdmin,
    onSuccess: () => {
      toast({ title: "Admin access revoked", variant: "success" });
      setRevokingAdmin(null);
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Revoke failed", description: err.message, variant: "destructive" });
    },
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin team"
        description="Manage backoffice admins and super admin access"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add admin
          </Button>
        }
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search admins..."
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={8} />
      ) : admins.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No admins found"
            description="Add an admin to grant backoffice access"
            icon={<Shield className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Invited by</th>
                  <th>Created</th>
                  <th className="w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.id === user?.id;
                  const adminStatus = getAdminStatus(admin);

                  return (
                    <tr key={admin.id}>
                      <td>
                        <p className="font-medium">{getAdminName(admin)}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </td>
                      <td className="text-sm text-foreground">{getAdminRoleLabel(admin)}</td>
                      <td>
                        <StatusBadge status={adminStatus.status} />
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {getInvitedByName(admin.invitedBy)}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={updateMutation.isPending}
                              onClick={() =>
                                setRoleChangeTarget({
                                  admin,
                                  nextIsSuperAdmin: !admin.isSuperAdmin,
                                })
                              }
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              {admin.isSuperAdmin ? "Remove super admin" : "Make super admin"}
                            </DropdownMenuItem>
                            {!isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                  onClick={() => setRevokingAdmin(admin)}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Revoke access
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {(paginationMeta.page - 1) * paginationMeta.limit + 1}–
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} admins
              </div>
              <div className="pagination-controls">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!paginationMeta.hasPrevPage || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {paginationMeta.page} of {paginationMeta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!paginationMeta.hasNextPage || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateAdminSheet open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog
        open={Boolean(roleChangeTarget)}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {roleChangeTarget?.nextIsSuperAdmin
                ? "Grant super admin access?"
                : "Remove super admin access?"}
            </DialogTitle>
            <DialogDescription>
              {roleChangeTarget?.nextIsSuperAdmin ? (
                <>
                  <strong>{roleChangeTarget.admin.email}</strong> will be able to approve payouts,
                  process refunds, resolve disputes, and manage application data.
                </>
              ) : (
                <>
                  <strong>{roleChangeTarget?.admin.email}</strong> will remain an admin but lose
                  super admin privileges.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={roleChangeTarget?.nextIsSuperAdmin ? "default" : "destructive"}
              disabled={updateMutation.isPending}
              onClick={() =>
                roleChangeTarget &&
                updateMutation.mutate({
                  id: roleChangeTarget.admin.id,
                  isSuperAdmin: roleChangeTarget.nextIsSuperAdmin,
                })
              }
            >
              {updateMutation.isPending
                ? "Saving…"
                : roleChangeTarget?.nextIsSuperAdmin
                  ? "Grant super admin"
                  : "Remove super admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revokingAdmin)} onOpenChange={(open) => !open && setRevokingAdmin(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke admin access?</DialogTitle>
            <DialogDescription>
              <strong>{revokingAdmin?.email}</strong> will lose backoffice access. Their user
              account will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRevokingAdmin(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={() => revokingAdmin && revokeMutation.mutate(revokingAdmin.id)}
            >
              {revokeMutation.isPending ? "Revoking…" : "Revoke access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
