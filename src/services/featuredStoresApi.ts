import { api } from "./baseQuery";
import {
  IApiResponse,
  FeaturedStoreEntry,
  FeaturedStorePlacement,
  PaginationMeta,
} from "@/types/api";

export interface GetFeaturedStoresParams {
  page?: number;
  limit?: number;
  placement?: FeaturedStorePlacement;
  isActive?: boolean;
}

export interface GetFeaturedStoresResponse {
  featuredStores: FeaturedStoreEntry[];
  meta: PaginationMeta;
}

export interface CreateFeaturedStorePayload {
  storeId: string;
  placement?: FeaturedStorePlacement;
  displayOrder?: number;
  note?: string;
}

export interface UpdateFeaturedStorePayload {
  placement?: FeaturedStorePlacement;
  displayOrder?: number;
  isActive?: boolean;
  note?: string;
}

export interface ReorderFeaturedStoresPayload {
  featuredStoreIds: string[];
}

export async function getFeaturedStores(
  params?: GetFeaturedStoresParams
): Promise<IApiResponse<GetFeaturedStoresResponse>> {
  return api.get<GetFeaturedStoresResponse>("/admin/featured-stores", { params });
}

export async function createFeaturedStore(
  payload: CreateFeaturedStorePayload
): Promise<IApiResponse<{ featuredStore: FeaturedStoreEntry }>> {
  return api.post<{ featuredStore: FeaturedStoreEntry }>("/admin/featured-stores", payload);
}

export async function updateFeaturedStore(
  id: string,
  payload: UpdateFeaturedStorePayload
): Promise<IApiResponse<{ featuredStore: FeaturedStoreEntry }>> {
  return api.patch<{ featuredStore: FeaturedStoreEntry }>(
    `/admin/featured-stores/${id}`,
    payload
  );
}

export async function deleteFeaturedStore(
  id: string
): Promise<IApiResponse<null>> {
  return api.delete<null>(`/admin/featured-stores/${id}`);
}

export async function reorderFeaturedStores(
  payload: ReorderFeaturedStoresPayload
): Promise<IApiResponse<null>> {
  return api.patch<null>("/admin/featured-stores/reorder", payload);
}
