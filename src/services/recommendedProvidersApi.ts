import { api } from "./baseQuery";
import { IApiResponse, RecommendedProvider, PaginationMeta } from "@/types/api";

/**
 * Recommended Providers API endpoints
 */

export interface GetRecommendedProvidersParams {
  page?: number | string;
  limit?: number | string;
  businessType?: string;
  city?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetRecommendedProvidersResponse {
  recommendations: RecommendedProvider[];
  meta: PaginationMeta;
}

/**
 * Get all recommended providers with filters and pagination
 */
export async function getRecommendedProviders(
  params?: GetRecommendedProvidersParams
): Promise<IApiResponse<GetRecommendedProvidersResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.businessType) queryParams.businessType = params.businessType;
  if (params?.city) queryParams.city = params.city;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetRecommendedProvidersResponse>("/recommended-providers/admin/all", {
    params: queryParams,
  });
}

