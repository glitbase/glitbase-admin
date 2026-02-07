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

export interface CreateMarketplaceCategoryPayload {
  name: string;
  type: "product" | "service";
  subcategories: string[];
  description?: string;
  imageUrl?: string;
  icon?: string;
}

export interface CreateMarketplaceCategoryResponse {
  category: MarketplaceCategory;
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

/**
 * Create a new marketplace category
 */
export async function createMarketplaceCategory(
  payload: CreateMarketplaceCategoryPayload
): Promise<IApiResponse<CreateMarketplaceCategoryResponse>> {
  return api.post<CreateMarketplaceCategoryResponse>("/marketplace-categories", payload);
}

export interface UpdateMarketplaceCategoryPayload {
  name?: string;
  type?: "product" | "service";
  subcategories?: string[];
  description?: string;
  imageUrl?: string;
  icon?: string;
}

export interface UpdateMarketplaceCategoryResponse {
  category: MarketplaceCategory;
}

/**
 * Update a marketplace category
 */
export async function updateMarketplaceCategory(
  id: string,
  payload: UpdateMarketplaceCategoryPayload
): Promise<IApiResponse<UpdateMarketplaceCategoryResponse>> {
  return api.patch<UpdateMarketplaceCategoryResponse>(`/marketplace-categories/${id}`, payload);
}

/**
 * Delete a marketplace category
 */
export async function deleteMarketplaceCategory(
  id: string
): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/marketplace-categories/${id}`);
}

