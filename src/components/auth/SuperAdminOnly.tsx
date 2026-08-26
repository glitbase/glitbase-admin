import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface SuperAdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperAdminOnly({ children, fallback = null }: SuperAdminOnlyProps) {
  const { isSuperAdmin } = usePermissions();
  if (!isSuperAdmin) return <>{fallback}</>;
  return <>{children}</>;
}
