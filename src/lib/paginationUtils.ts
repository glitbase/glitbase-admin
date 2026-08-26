import type { PaginationMeta } from "@/types/api";

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Normalizes pagination meta from API responses.
 * Backend may use totalDocs, hasPreviousPage, pageSize, etc.
 */
export function normalizePaginationMeta(
  meta: PaginationMeta | undefined | null,
  fallbackLimit = 20
): PaginationMeta | undefined {
  if (!meta) return undefined;

  const raw = meta as unknown as Record<string, unknown>;

  const page = toNumber(meta.page ?? raw.currentPage, 1);
  const limit = toNumber(meta.limit ?? raw.pageSize, fallbackLimit);
  const total = toNumber(raw.totalDocs ?? meta.total ?? raw.total, 0);
  const totalPages = toNumber(
    meta.totalPages ?? raw.totalPages,
    limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: Boolean(raw.hasNextPage ?? meta.hasNextPage),
    hasPrevPage: Boolean(raw.hasPreviousPage ?? meta.hasPrevPage),
  };
}

export function getPaginationRange(meta: PaginationMeta) {
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return { start, end };
}
