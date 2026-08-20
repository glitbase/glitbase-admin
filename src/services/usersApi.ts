import { api } from "./baseQuery";
import { IApiResponse, User, PaginationMeta } from "@/types/api";

/**
 * Users API endpoints
 */

export interface GetUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: "admin" | "vendor" | "customer";
  vendorOnboardingStatus?: "pending" | "completed" | "approved" | "rejected";
  countryName?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface GetUsersResponse {
  users: User[];
  meta: PaginationMeta;
}

/**
 * Get all users with filters and pagination
 */
export async function getUsers(params?: GetUsersParams): Promise<IApiResponse<GetUsersResponse>> {
  return api.get<GetUsersResponse>("/users", {
    params: {
      ...params,
      // Convert dates to ISO strings if provided
      startDate: params?.startDate,
      endDate: params?.endDate,
    },
  });
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<IApiResponse<{ user: User }>> {
  return api.get<{ user: User }>(`/users/${id}`);
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "customer" | "vendor";
  phoneNumber?: string;
  countryName?: string;
  countryCode?: string;
  sendWelcomeEmail?: boolean;
  storeName?: string;
}

export interface CreateUserResponse {
  user: User;
}

/**
 * Manually create a user (Admin only)
 */
export async function createUser(
  payload: CreateUserPayload
): Promise<IApiResponse<CreateUserResponse>> {
  return api.post<CreateUserResponse>("/admin/users", payload);
}

