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

export interface CreateInspirationCategoryPayload {
  title: string;
  emoji: string;
  type: "stylesInspo" | "touchupsTransformations";
}

export interface CreateInspirationCategoryResponse {
  category: InspirationCategory;
}

/**
 * Create a new inspiration category
 */
export async function createInspirationCategory(
  payload: CreateInspirationCategoryPayload
): Promise<IApiResponse<CreateInspirationCategoryResponse>> {
  return api.post<CreateInspirationCategoryResponse>("/inspiration-categories/admin", payload);
}

export interface UpdateInspirationCategoryPayload {
  title?: string;
  emoji?: string;
  type?: "stylesInspo" | "touchupsTransformations";
}

export interface UpdateInspirationCategoryResponse {
  category: InspirationCategory;
}

/**
 * Update an inspiration category
 */
export async function updateInspirationCategory(
  id: string,
  payload: UpdateInspirationCategoryPayload
): Promise<IApiResponse<UpdateInspirationCategoryResponse>> {
  return api.put<UpdateInspirationCategoryResponse>(`/inspiration-categories/admin/${id}`, payload);
}

/**
 * Delete an inspiration category
 */
export async function deleteInspirationCategory(
  id: string
): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/inspiration-categories/admin/${id}`);
}

