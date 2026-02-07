import { api } from "./baseQuery";
import { IApiResponse, Glit, PaginationMeta } from "@/types/api";

/**
 * Glits API endpoints
 */

export interface GetGlitsParams {
  page?: number | string;
  limit?: number | string;
  userId?: string;
  category?: string;
  isPrivate?: boolean | string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetGlitsResponse {
  glits: Glit[];
  meta: PaginationMeta;
}

/**
 * Get all glits with filters and pagination
 */
export async function getGlits(
  params?: GetGlitsParams
): Promise<IApiResponse<GetGlitsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.userId) queryParams.userId = params.userId;
  if (params?.category) queryParams.category = params.category;
  if (params?.isPrivate !== undefined) queryParams.isPrivate = String(params.isPrivate);
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetGlitsResponse>("/glits/admin/all", {
    params: queryParams,
  });
}

