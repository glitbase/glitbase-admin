import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  adminDeleteUser,
  getAdminUserDeleteEligibility,
} from "@/services/usersApi";
import type { AccountDeletionBlocker, UserRole } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import {
  formatBlockerMessageForAdmin,
  normalizeDeletionEligibility,
} from "@/lib/accountDeletionUtils";

const REASON_MAX = 500;

export interface DeleteUserAccountTarget {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: UserRole[];
  isSuperAdmin?: boolean;
  accountStatus?: string;
  deletedAt?: Date | string | null;
}

interface DeleteUserAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: DeleteUserAccountTarget | null;
  currentUserId?: string | null;
  onDeleted?: () => void;
}

type GuardReason = "self" | "deleted" | "admin_requires_super" | null;

function getDisplayName(user: DeleteUserAccountTarget) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

function isDeletedUser(user: DeleteUserAccountTarget) {
  return Boolean(user.deletedAt || user.accountStatus === "deleted");
}

function isAdminTarget(user: DeleteUserAccountTarget) {
  return Boolean(user.isSuperAdmin || user.roles?.includes("admin"));
}

function getGuardReason(
  user: DeleteUserAccountTarget | null,
  currentUserId: string | null | undefined,
  isSuperAdmin: boolean
): GuardReason {
  if (!user) return null;
  if (currentUserId && user.id === currentUserId) return "self";
  if (isDeletedUser(user)) return "deleted";
  if (isAdminTarget(user) && !isSuperAdmin) return "admin_requires_super";
  return null;
}

function BlockerList({ blockers }: { blockers: AccountDeletionBlocker[] }) {
  if (!blockers.length) return null;

  return (
    <ul className="space-y-2">
      {blockers.map((blocker, index) => (
        <li
          key={`${blocker.code}-${index}`}
          className="flex gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm"
        >
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <span className="text-foreground">{blocker.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function DeleteUserAccountDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onDeleted,
}: DeleteUserAccountDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isSuperAdmin } = usePermissions();
  const [reason, setReason] = useState("");
  const [force, setForce] = useState(false);
  const [submitBlockers, setSubmitBlockers] = useState<AccountDeletionBlocker[]>([]);

  const guardReason = getGuardReason(user, currentUserId, isSuperAdmin);
  const canCheckEligibility = open && Boolean(user?.id) && !guardReason;

  useEffect(() => {
    if (!open) {
      setReason("");
      setForce(false);
      setSubmitBlockers([]);
    }
  }, [open]);

  const {
    data: eligibilityResponse,
    isLoading: eligibilityLoading,
    isError: eligibilityError,
    error: eligibilityErrorObj,
    isFetched: eligibilityFetched,
  } = useQuery({
    queryKey: ["user-delete-eligibility", user?.id],
    queryFn: () => getAdminUserDeleteEligibility(user!.id),
    enabled: canCheckEligibility,
    retry: false,
  });

  const parsedEligibility = useMemo(() => {
    if (eligibilityResponse && eligibilityResponse.status === false) return null;
    return normalizeDeletionEligibility(eligibilityResponse?.data);
  }, [eligibilityResponse]);

  const blockers = useMemo(() => {
    if (submitBlockers.length > 0) {
      return submitBlockers.map((b) => ({
        ...b,
        message: formatBlockerMessageForAdmin(b),
      }));
    }
    return parsedEligibility?.blockers ?? [];
  }, [submitBlockers, parsedEligibility?.blockers]);

  const eligible = parsedEligibility?.eligible ?? false;
  const eligibilityKnown = eligibilityFetched && !eligibilityError && parsedEligibility != null;

  const trimmedReason = reason.trim();
  const reasonValid = trimmedReason.length > 0 && trimmedReason.length <= REASON_MAX;

  const showForceDelete =
    isSuperAdmin &&
    canCheckEligibility &&
    !eligibilityLoading &&
    (eligibilityError || (eligibilityFetched && !eligible));

  const canDelete = useMemo(() => {
    if (!user || guardReason || !reasonValid || eligibilityLoading) return false;
    if (force && isSuperAdmin) {
      return eligibilityError || !eligible;
    }
    return eligibilityKnown && eligible;
  }, [
    user,
    guardReason,
    reasonValid,
    eligibilityLoading,
    force,
    isSuperAdmin,
    eligibilityError,
    eligible,
    eligibilityKnown,
  ]);

  const eligibilityErrorMessage =
    eligibilityErrorObj instanceof Error ? eligibilityErrorObj.message : "Try again or contact support.";
  const eligibilityRouteMissing =
    eligibilityError &&
    /cannot get.*delete\/eligibility/i.test(eligibilityErrorMessage);

  const mutation = useMutation({
    mutationFn: () =>
      adminDeleteUser(user!.id, {
        reason: trimmedReason,
        force: force && isSuperAdmin ? true : undefined,
      }),
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "The user has been soft-deleted and anonymized.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-detail", user?.id] });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err: Error & { status?: number; data?: { blockers?: AccountDeletionBlocker[] } }) => {
      const blockersFromError = err.data?.blockers;
      if (blockersFromError?.length) {
        setSubmitBlockers(blockersFromError);
      }
      toast({
        title: "Could not delete account",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const displayName = user ? getDisplayName(user) : "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete user account
          </DialogTitle>
          <DialogDescription>
            Permanently removes personal data, unpublishes vendor content, and cancels active
            subscriptions. This matches the self-service deletion flow.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target user
              </p>
              <p className="font-semibold text-foreground mt-0.5 capitalize">{displayName}</p>
              <p className="text-sm text-muted-foreground break-all">{user.email}</p>
            </div>

            {guardReason === "self" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm flex gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p>
                  You cannot delete your own account here. Use{" "}
                  <span className="font-medium">POST /users/me/delete-account</span> instead.
                </p>
              </div>
            )}

            {guardReason === "deleted" && (
              <div className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                This account is already deleted.
              </div>
            )}

            {guardReason === "admin_requires_super" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm flex gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p>
                  Only super admins can delete admin or super admin accounts. Revoke admin access
                  from the Team page instead.
                </p>
              </div>
            )}

            {canCheckEligibility && (
              <>
                {eligibilityLoading ? (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Checking deletion eligibility…
                  </p>
                ) : eligibilityError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm space-y-2">
                    <p className="font-medium text-destructive">Could not check eligibility</p>
                    <p className="text-muted-foreground">{eligibilityErrorMessage}</p>
                    {eligibilityRouteMissing && (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        The API server does not expose{" "}
                        <span className="font-mono">GET /admin/users/:id/delete/eligibility</span>{" "}
                        yet. Restart or update <span className="font-medium">glitbase-backend</span>{" "}
                        (admin delete routes live in{" "}
                        <span className="font-mono">AdminUserController</span>). Super admins can
                        still use force delete below once the delete endpoint is available.
                      </p>
                    )}
                  </div>
                ) : eligible ? (
                  <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
                    This user can be deleted. No blockers were found (no active bookings, open
                    disputes, wallet balance, or in-progress payouts).
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Deletion is blocked until these are resolved:
                    </p>
                    {blockers.length > 0 ? (
                      <BlockerList blockers={blockers} />
                    ) : (
                      <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-muted-foreground">
                        The API reported this account as not eligible, but did not return specific
                        blockers. Resolve active bookings, disputes, wallet balance, or payouts in
                        the admin app, or ask a super admin to use force delete.
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter a reason below. Delete stays disabled until eligibility passes, unless
                      you are a super admin and enable force delete.
                    </p>
                  </div>
                )}

                {showForceDelete && (
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-3 space-y-2",
                      force ? "border-destructive/40 bg-destructive/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="force-delete-user" className="text-sm font-medium">
                          Force delete
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Super admin only — bypass booking, wallet, and payout blockers.
                        </p>
                      </div>
                      <Switch
                        id="force-delete-user"
                        checked={force}
                        onCheckedChange={setForce}
                        disabled={mutation.isPending}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="delete-user-reason">
                      Reason for deletion <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {trimmedReason.length}/{REASON_MAX}
                    </span>
                  </div>
                  <Textarea
                    id="delete-user-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                    placeholder="Requested removal — duplicate account"
                    rows={4}
                    disabled={mutation.isPending}
                    className="resize-y min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stored as <span className="font-mono">deletionReason</span> for audit.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canDelete || mutation.isPending || Boolean(guardReason)}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting…" : force ? "Force delete account" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
