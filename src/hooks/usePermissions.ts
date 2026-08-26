import { useAuth } from "@/contexts/AuthContext";

export function usePermissions() {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  return {
    isSuperAdmin,
    canProcessRefunds: isSuperAdmin,
    canResolveDisputes: isSuperAdmin,
    canApprovePayouts: isSuperAdmin,
    canManageApplicationData: isSuperAdmin,
    canManageAdminTeam: isSuperAdmin,
  };
}
