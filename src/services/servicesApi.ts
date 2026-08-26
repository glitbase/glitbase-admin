import { api } from "./baseQuery";
import { IApiResponse, Service, PaginationMeta, ServiceType, ApprovalStatus } from "@/types/api";

/**
 * Services API endpoints
 */

export interface GetServicesParams {
  page?: number;
  limit?: number;
  status?: ApprovalStatus;
  searchTerm?: string;
  vendorId?: string;
  storeId?: string;
  categoryId?: string;
  isDeleted?: boolean;
}

export interface GetAdminServicesParams {
  page?: number;
  limit?: number;
  storeId?: string;
  category?: string;
  subcategory?: string;
  type?: ServiceType[];
  durations?: number[];
  minDurationInMinutes?: number;
  maxDurationInMinutes?: number;
  status?: ApprovalStatus;
  searchTerm?: string;
  isDeleted?: boolean;
  isSuspended?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface GetServicesResponse {
  services: Service[];
  meta: PaginationMeta;
}

function serializeAdminServicesParams(
  params?: GetAdminServicesParams
): Record<string, string | number | boolean | undefined> {
  if (!params) return {};

  const query: Record<string, string | number | boolean | undefined> = {};

  if (params.page != null) query.page = params.page;
  if (params.limit != null) query.limit = params.limit;
  if (params.storeId) query.storeId = params.storeId;
  if (params.category) query.category = params.category;
  if (params.subcategory) query.subcategory = params.subcategory;
  if (params.type?.length) query.type = params.type.join(",");
  if (params.durations?.length) query.durations = params.durations.join(",");
  if (params.minDurationInMinutes != null) query.minDurationInMinutes = params.minDurationInMinutes;
  if (params.maxDurationInMinutes != null) query.maxDurationInMinutes = params.maxDurationInMinutes;
  if (params.status) query.status = params.status;
  if (params.searchTerm) query.searchTerm = params.searchTerm;
  if (params.isDeleted != null) query.isDeleted = params.isDeleted;
  if (params.isSuspended != null) query.isSuspended = params.isSuspended;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;

  return query;
}

/**
 * Get all services with filters and pagination (public listing)
 */
export async function getServices(params?: GetServicesParams): Promise<IApiResponse<GetServicesResponse>> {
  return api.get<GetServicesResponse>("/services", {
    params,
  });
}

/**
 * Admin service queue with advanced filters
 */
export async function getAdminServices(
  params?: GetAdminServicesParams
): Promise<IApiResponse<GetServicesResponse>> {
  return api.get<GetServicesResponse>("/services/admin", {
    params: serializeAdminServicesParams(params),
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
