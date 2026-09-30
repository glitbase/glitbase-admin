import { useAuth } from "@/contexts/AuthContext";
import { resolveIsSuperAdmin } from "@/lib/authUtils";

export function usePermissions() {
  const { user } = useAuth();
  const isSuperAdmin = resolveIsSuperAdmin(user);

  return {
    isSuperAdmin,
    canProcessRefunds: isSuperAdmin,
    canResolveDisputes: isSuperAdmin,
    canApprovePayouts: isSuperAdmin,
    canManageApplicationData: isSuperAdmin,
    canManageAdminTeam: isSuperAdmin,
  };
}
