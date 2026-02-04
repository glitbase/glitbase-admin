import { api } from "./baseQuery";
import { IApiResponse, Service, PaginationMeta } from "@/types/api";

/**
 * Services API endpoints
 */

export interface GetServicesParams {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  searchTerm?: string;
  vendorId?: string;
  storeId?: string;
  categoryId?: string;
  isDeleted?: boolean;
}

export interface GetServicesResponse {
  services: Service[];
  meta: PaginationMeta;
}

/**
 * Get all services with filters and pagination
 */
export async function getServices(params?: GetServicesParams): Promise<IApiResponse<GetServicesResponse>> {
  return api.get<GetServicesResponse>("/services", {
    params,
  });
}

/**
 * Get service by ID
 */
export async function getServiceById(id: string): Promise<IApiResponse<{ service: Service }>> {
  return api.get<{ service: Service }>(`/services/${id}`);
}

/**
 * Approve service
 */
export async function approveService(id: string): Promise<IApiResponse<{ service: Service }>> {
  return api.patch<{ service: Service }>(`/services/${id}/approve`);
}

/**
 * Reject service
 */
export async function rejectService(id: string, rejectionReason: string): Promise<IApiResponse<{ service: Service }>> {
  return api.patch<{ service: Service }>(`/services/${id}/reject`, { rejectionReason });
}

