import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { canManageAdminTeam } = usePermissions();

  if (!canManageAdminTeam) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
