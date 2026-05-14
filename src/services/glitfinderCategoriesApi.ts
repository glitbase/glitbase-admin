import { api } from "./baseQuery";
import { IApiResponse, GlitfinderCategory, PaginationMeta } from "@/types/api";

export interface GetGlitfinderCategoriesResponse {
  categories: GlitfinderCategory[];
  meta: PaginationMeta;
}

export interface CreateGlitfinderCategoryPayload {
  name: string;
  subcategories: string[];
  description?: string;
  imageUrl?: string;
  icon?: string;
  order?: number;
}

export interface UpdateGlitfinderCategoryPayload {
  name?: string;
  subcategories?: string[];
  description?: string;
  imageUrl?: string;
  icon?: string;
  order?: number;
}

/**
 * List all Glitfinder discovery categories sorted by order (public)
 */
export async function getGlitfinderCategories(): Promise<IApiResponse<GetGlitfinderCategoriesResponse>> {
  return api.get<GetGlitfinderCategoriesResponse>("/glitfinder-categories");
}

/**
 * Get single Glitfinder category by ID (public)
 */
export async function getGlitfinderCategoryById(id: string): Promise<IApiResponse<GlitfinderCategory>> {
  return api.get<GlitfinderCategory>(`/glitfinder-categories/${id}`);
}

/**
 * Create a Glitfinder category (Admin only)
 */
export async function createGlitfinderCategory(
  payload: CreateGlitfinderCategoryPayload
): Promise<IApiResponse<GlitfinderCategory>> {
  return api.post<GlitfinderCategory>("/glitfinder-categories", payload);
}

/**
 * Update a Glitfinder category (Admin only)
 */
export async function updateGlitfinderCategory(
  id: string,
  payload: UpdateGlitfinderCategoryPayload
): Promise<IApiResponse<GlitfinderCategory>> {
  return api.patch<GlitfinderCategory>(`/glitfinder-categories/${id}`, payload);
}

/**
 * Delete a Glitfinder category (Admin only)
 */
export async function deleteGlitfinderCategory(id: string): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/glitfinder-categories/${id}`);
}
