import { api } from "./baseQuery";
import { IApiResponse, Subscription, PaginationMeta } from "@/types/api";

/**
 * Subscriptions API endpoints
 */

export interface GetSubscriptionsParams {
  page?: number | string;
  limit?: number | string;
  status?: "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";
  subscriptionType?: "monthly" | "yearly";
  vendorId?: string;
  planId?: string;
  currency?: "NGN" | "GBP" | "USD";
  minAmount?: number | string;
  maxAmount?: number | string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
}

export interface GetSubscriptionsResponse {
  subscriptions: Subscription[];
  meta: PaginationMeta;
}

/**
 * Get all subscriptions with filters and pagination
 */
export async function getSubscriptions(params?: GetSubscriptionsParams): Promise<IApiResponse<GetSubscriptionsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.status) queryParams.status = params.status;
  if (params?.subscriptionType) queryParams.subscriptionType = params.subscriptionType;
  if (params?.vendorId) queryParams.vendorId = params.vendorId;
  if (params?.planId) queryParams.planId = params.planId;
  if (params?.currency) queryParams.currency = params.currency;
  if (params?.minAmount !== undefined) queryParams.minAmount = String(params.minAmount);
  if (params?.maxAmount !== undefined) queryParams.maxAmount = String(params.maxAmount);
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  
  return api.get<GetSubscriptionsResponse>("/subscriptions/admin/all", {
    params: queryParams,
  });
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: string): Promise<IApiResponse<{ subscription: Subscription }>> {
  return api.get<{ subscription: Subscription }>(`/subscriptions/${id}`);
}

