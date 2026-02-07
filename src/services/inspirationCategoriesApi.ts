import { api } from "./baseQuery";
import { IApiResponse, InspirationCategory, PaginationMeta } from "@/types/api";

/**
 * Inspiration Categories API endpoints
 */

export interface GetInspirationCategoriesParams {
  page?: number | string;
  limit?: number | string;
  type?: "stylesInspo" | "touchupsTransformations";
  search?: string;
}

export interface GetInspirationCategoriesResponse {
  categories: InspirationCategory[];
  meta: PaginationMeta;
}

/**
 * Get all inspiration categories with filters and pagination
 */
export async function getInspirationCategories(
  params?: GetInspirationCategoriesParams
): Promise<IApiResponse<GetInspirationCategoriesResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.type) queryParams.type = params.type;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetInspirationCategoriesResponse>("/inspiration-categories/admin", {
    params: queryParams,
  });
}

