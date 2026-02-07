import { api } from "./baseQuery";
import { IApiResponse, Report, PaginationMeta } from "@/types/api";

/**
 * Reports API endpoints
 */

export interface GetReportsParams {
  page?: number | string;
  limit?: number | string;
  type?: "user" | "store" | "product" | "service" | "review" | "glit";
  status?: "pending" | "reviewing" | "resolved" | "dismissed";
}

export interface GetReportsResponse {
  docs: Report[];
  meta: PaginationMeta;
}

/**
 * Get all reports with filters and pagination
 */
export async function getReports(
  params?: GetReportsParams
): Promise<IApiResponse<GetReportsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.type) queryParams.type = params.type;
  if (params?.status) queryParams.status = params.status;
  
  return api.get<GetReportsResponse>("/reports/admin/all", {
    params: queryParams,
  });
}

/**
 * Get report by ID
 */
export async function getReportById(id: string): Promise<IApiResponse<{ report: Report }>> {
  return api.get<{ report: Report }>(`/reports/admin/${id}`);
}

export interface UpdateReportStatusParams {
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  reviewNote?: string;
}

export interface UpdateReportStatusResponse {
  report: Report;
}

/**
 * Update report status
 */
export async function updateReportStatus(
  id: string,
  params: UpdateReportStatusParams
): Promise<IApiResponse<UpdateReportStatusResponse>> {
  return api.patch<UpdateReportStatusResponse>(`/reports/admin/${id}`, params);
}

