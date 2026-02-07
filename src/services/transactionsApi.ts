import { api } from "./baseQuery";
import { IApiResponse, Transaction, PaginationMeta } from "@/types/api";

/**
 * Transactions API endpoints
 */

export interface GetTransactionsParams {
  page?: number | string;
  limit?: number | string;
  type?: "credit" | "debit" | "transfer";
  category?: string;
  vendorId?: string;
  currency?: "NGN" | "GBP" | "USD";
  referenceType?: "booking" | "payment" | "payout";
  minAmount?: number | string;
  maxAmount?: number | string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
  meta: PaginationMeta;
}

/**
 * Get all transactions with filters and pagination
 */
export async function getTransactions(params?: GetTransactionsParams): Promise<IApiResponse<GetTransactionsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.type) queryParams.type = params.type;
  if (params?.category) queryParams.category = params.category;
  if (params?.vendorId) queryParams.vendorId = params.vendorId;
  if (params?.currency) queryParams.currency = params.currency;
  if (params?.referenceType) queryParams.referenceType = params.referenceType;
  if (params?.minAmount !== undefined) queryParams.minAmount = String(params.minAmount);
  if (params?.maxAmount !== undefined) queryParams.maxAmount = String(params.maxAmount);
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetTransactionsResponse>("/wallet/transactions/admin/all", {
    params: queryParams,
  });
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<IApiResponse<{ transaction: Transaction }>> {
  return api.get<{ transaction: Transaction }>(`/wallet/transactions/${id}`);
}

