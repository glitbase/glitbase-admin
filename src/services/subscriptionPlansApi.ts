import { api } from "./baseQuery";
import { IApiResponse, SubscriptionPlan, PaginationMeta } from "@/types/api";

/**
 * Subscription Plans API endpoints
 */

export interface GetSubscriptionPlansParams {
  page?: number | string;
  limit?: number | string;
  type?: "monthly" | "yearly";
  isActive?: boolean;
}

export interface GetSubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  meta: PaginationMeta;
}

/**
 * Get all subscription plans with filters and pagination
 */
export async function getSubscriptionPlans(
  params?: GetSubscriptionPlansParams
): Promise<IApiResponse<GetSubscriptionPlansResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.type) queryParams.type = params.type;
  if (params?.isActive !== undefined) queryParams.isActive = String(params.isActive);
  
  return api.get<GetSubscriptionPlansResponse>("/subscription-plans", {
    params: queryParams,
  });
}

