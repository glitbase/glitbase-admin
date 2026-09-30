import type { User } from "@/types/api";

/** Matches backend SuperAdminGuard / UserService.isSuperAdmin semantics. */
export function resolveIsSuperAdmin(
  user: Pick<User, "isSuperAdmin" | "roles"> | null | undefined
): boolean {
  if (!user?.roles?.includes("admin")) return false;
  return user.isSuperAdmin === true;
}
