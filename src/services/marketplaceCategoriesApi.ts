import { api } from "./baseQuery";
import { IApiResponse, MarketplaceCategory, PaginationMeta } from "@/types/api";

/**
 * Marketplace Categories API endpoints
 */

export interface GetMarketplaceCategoriesParams {
  type: "product" | "service";
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
}

export interface GetMarketplaceCategoriesResponse {
  categories: MarketplaceCategory[];
  meta: PaginationMeta;
}

/**
 * Get all marketplace categories with filters and pagination
 */
export async function getMarketplaceCategories(
  params: GetMarketplaceCategoriesParams
): Promise<IApiResponse<GetMarketplaceCategoriesResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string> = {
    type: params.type,
  };
  
  if (params.page !== undefined) queryParams.page = String(params.page);
  if (params.limit !== undefined) queryParams.limit = String(params.limit);
  if (params.searchTerm) queryParams.searchTerm = params.searchTerm;
  
  return api.get<GetMarketplaceCategoriesResponse>("/marketplace-categories", {
    params: queryParams,
  });
}

