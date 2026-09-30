import type { AccountDeletionBlocker } from "@/types/api";

export function normalizeDeletionEligibility(raw: unknown): {
  eligible: boolean;
  blockers: AccountDeletionBlocker[];
} | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;

  // Some responses may nest under `eligibility`
  const source =
    record.eligible !== undefined || Array.isArray(record.blockers)
      ? record
      : record.eligibility && typeof record.eligibility === "object"
        ? (record.eligibility as Record<string, unknown>)
        : record;

  const eligible = Boolean(source.eligible);
  const blockersRaw = source.blockers;

  const blockers = Array.isArray(blockersRaw)
    ? blockersRaw
        .filter((item): item is AccountDeletionBlocker => item != null && typeof item === "object")
        .map((item) => ({
          code: String((item as AccountDeletionBlocker).code ?? "UNKNOWN"),
          message: formatBlockerMessageForAdmin(item as AccountDeletionBlocker),
          count: (item as AccountDeletionBlocker).count,
          amount: (item as AccountDeletionBlocker).amount,
          currency: (item as AccountDeletionBlocker).currency,
        }))
    : [];

  return { eligible, blockers };
}

/** Backend copy is written for end users ("You have…"); rewrite for admins. */
export function formatBlockerMessageForAdmin(blocker: AccountDeletionBlocker): string {
  if (blocker.message?.trim()) {
    return blocker.message
      .replace(/^You have /i, "This user has ")
      .replace(/^Your store has /i, "Their store has ")
      .replace(/^Withdraw your wallet balance before deleting/i, "Wallet balance must be cleared")
      .replace(/^Admin accounts cannot be self-deleted\./i, "Admin account — revoke access or use force delete (super admin).");
  }

  switch (blocker.code) {
    case "ACTIVE_BOOKINGS":
      return blocker.count != null
        ? `${blocker.count} active booking(s) must be completed or cancelled first`
        : "Active bookings must be resolved first";
    case "OPEN_DISPUTES":
      return blocker.count != null
        ? `${blocker.count} open dispute(s) must be resolved first`
        : "Open disputes must be resolved first";
    case "WALLET_BALANCE":
      return blocker.amount != null
        ? `Wallet balance must be withdrawn (${blocker.amount}${blocker.currency ? ` ${blocker.currency}` : ""})`
        : "Wallet balance must be cleared first";
    case "PENDING_PAYOUTS":
      return blocker.count != null
        ? `${blocker.count} payout(s) still in progress`
        : "Pending payouts must complete first";
    case "ADMIN_ACCOUNT":
      return "Admin account — revoke admin access or use force delete (super admin only)";
    default:
      return `Blocked: ${String(blocker.code).replace(/_/g, " ").toLowerCase()}`;
  }
}
