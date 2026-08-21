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

export interface GetAdminStoresParams {
  page?: number;
  limit?: number;
  isPublic?: boolean;
}

export interface GetStoresResponse {
  stores: Store[];
  meta: PaginationMeta;
}

/**
 * Get all stores with filters and pagination (public listing)
 */
export async function getStores(params?: GetStoresParams): Promise<IApiResponse<GetStoresResponse>> {
  return api.get<GetStoresResponse>("/stores", {
    params,
  });
}

/**
 * Admin store review queue
 */
export async function getAdminStores(
  params?: GetAdminStoresParams
): Promise<IApiResponse<GetStoresResponse>> {
  return api.get<GetStoresResponse>("/stores/admin", { params });
}

/**
 * Get store by ID
 */
export async function getStoreById(storeId: string): Promise<IApiResponse<{ store: Store }>> {
  return api.get<{ store: Store }>(`/stores/${storeId}`);
}

/**
 * Approve store — sets isPublic: true and clears rejectionReason
 */
export async function approveStore(storeId: string): Promise<IApiResponse<{ store: Store }>> {
  return api.patch<{ store: Store }>(`/stores/${storeId}/approve`);
}

/**
 * Reject store — sets isPublic: false and saves rejectionReason
 */
export async function rejectStore(
  storeId: string,
  rejectionReason: string
): Promise<IApiResponse<{ store: Store }>> {
  return api.patch<{ store: Store }>(`/stores/${storeId}/reject`, { rejectionReason });
}
