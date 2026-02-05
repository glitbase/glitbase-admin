import { api } from "./baseQuery";
import { IApiResponse, Payout, PaginationMeta } from "@/types/api";

/**
 * Payouts API endpoints
 */

export interface GetPayoutsParams {
  page?: number | string;
  limit?: number | string;
  category?: string;
  status?: "pending_approval" | "approved" | "processing" | "completed" | "failed" | "cancelled";
  payoutMethod?: "bank_transfer" | "mobile_money" | "paypal" | "stripe_connect";
  vendorId?: string;
  currency?: "NGN" | "GBP" | "USD";
  minAmount?: number | string;
  maxAmount?: number | string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetPayoutsResponse {
  payouts: Payout[];
  meta: PaginationMeta;
}

/**
 * Get all payouts with filters and pagination
 */
export async function getPayouts(params?: GetPayoutsParams): Promise<IApiResponse<GetPayoutsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.category) queryParams.category = params.category;
  if (params?.status) queryParams.status = params.status;
  if (params?.payoutMethod) queryParams.payoutMethod = params.payoutMethod;
  if (params?.vendorId) queryParams.vendorId = params.vendorId;
  if (params?.currency) queryParams.currency = params.currency;
  if (params?.minAmount !== undefined) queryParams.minAmount = String(params.minAmount);
  if (params?.maxAmount !== undefined) queryParams.maxAmount = String(params.maxAmount);
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetPayoutsResponse>("/wallet/payouts/admin/all", {
    params: queryParams,
  });
}

/**
 * Get payout by ID
 */
export async function getPayoutById(id: string): Promise<IApiResponse<{ payout: Payout }>> {
  return api.get<{ payout: Payout }>(`/wallet/payouts/${id}`);
}

