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

export interface CreateSubscriptionPlanPayload {
  name: string;
  type: "monthly" | "yearly";
  price: number;
  currency: string;
  description?: string;
  durationInMonths: number;
  isActive: boolean;
  stripePriceId: string;
}

export interface CreateSubscriptionPlanResponse {
  id: string;
  name: string;
  type: "monthly" | "yearly";
  price: number;
  currency: string;
  description?: string;
  durationInMonths: number;
  isActive: boolean;
  stripePriceId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new subscription plan
 */
export async function createSubscriptionPlan(
  payload: CreateSubscriptionPlanPayload
): Promise<IApiResponse<CreateSubscriptionPlanResponse>> {
  return api.post<CreateSubscriptionPlanResponse>("/subscription-plans", payload);
}

export interface UpdateSubscriptionPlanPayload {
  name?: string;
  price?: number;
  description?: string;
  isActive?: boolean;
  stripePriceId?: string;
}

export interface UpdateSubscriptionPlanResponse {
  id: string;
  name: string;
  type: "monthly" | "yearly";
  price: number;
  currency: string;
  description?: string;
  durationInMonths: number;
  isActive: boolean;
  stripePriceId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update a subscription plan
 */
export async function updateSubscriptionPlan(
  id: string,
  payload: UpdateSubscriptionPlanPayload
): Promise<IApiResponse<UpdateSubscriptionPlanResponse>> {
  return api.patch<UpdateSubscriptionPlanResponse>(`/subscription-plans/${id}`, payload);
}

/**
 * Delete a subscription plan
 */
export async function deleteSubscriptionPlan(
  id: string
): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/subscription-plans/${id}`);
}

