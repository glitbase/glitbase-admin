import { api } from "./baseQuery";
import { IApiResponse, Payment, PaginationMeta } from "@/types/api";

/**
 * Payments API endpoints
 */

export interface GetPaymentsParams {
  page?: number | string;
  limit?: number | string;
  status?: "pending" | "completed" | "failed" | "refunded";
  paymentMethod?: "card" | "bank_transfer" | "wallet";
  paymentGateway?: "stripe" | "paystack";
  paymentType?: "booking" | "subscription" | "product" | "wallet_topup";
  userId?: string;
  currency?: "NGN" | "GBP" | "USD";
  minAmount?: number | string;
  maxAmount?: number | string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetPaymentsResponse {
  payments: Payment[];
  meta: PaginationMeta;
}

/**
 * Get all payments with filters and pagination
 */
export async function getPayments(params?: GetPaymentsParams): Promise<IApiResponse<GetPaymentsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.status) queryParams.status = params.status;
  if (params?.paymentMethod) queryParams.paymentMethod = params.paymentMethod;
  if (params?.paymentGateway) queryParams.paymentGateway = params.paymentGateway;
  if (params?.paymentType) queryParams.paymentType = params.paymentType;
  if (params?.userId) queryParams.userId = params.userId;
  if (params?.currency) queryParams.currency = params.currency;
  if (params?.minAmount !== undefined) queryParams.minAmount = String(params.minAmount);
  if (params?.maxAmount !== undefined) queryParams.maxAmount = String(params.maxAmount);
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetPaymentsResponse>("/payments/admin/all", {
    params: queryParams,
  });
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<IApiResponse<{ payment: Payment }>> {
  return api.get<{ payment: Payment }>(`/payments/${id}`);
}

