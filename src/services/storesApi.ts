import { api } from "./baseQuery";
import { IApiResponse, Store, PaginationMeta } from "@/types/api";

/**
 * Stores API endpoints
 */

export interface GetStoresParams {
  page?: number;
  limit?: number;
  name?: string;
  vendorId?: string;
  countryName?: string;
}

export interface GetStoresResponse {
  stores: Store[];
  meta: PaginationMeta;
}

/**
 * Get all stores with filters and pagination
 */
export async function getStores(params?: GetStoresParams): Promise<IApiResponse<GetStoresResponse>> {
  return api.get<GetStoresResponse>("/stores", {
    params,
  });
}

/**
 * Get store by ID
 */
export async function getStoreById(storeId: string): Promise<IApiResponse<{ store: Store }>> {
  return api.get<{ store: Store }>(`/stores/${storeId}`);
}

