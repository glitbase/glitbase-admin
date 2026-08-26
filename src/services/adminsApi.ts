import { api } from "./baseQuery";
import { IApiResponse, AdminTeamMember, PaginationMeta, User } from "@/types/api";

export interface GetAdminsParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export interface GetAdminsResponse {
  admins: AdminTeamMember[];
  meta: PaginationMeta;
}

export interface CreateAdminPayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryName: string;
  countryCode: string;
  password: string;
  mustChangePassword?: boolean;
  sendWelcomeEmail?: boolean;
  isSuperAdmin?: boolean;
}

export interface UpdateAdminPayload {
  isSuperAdmin: boolean;
}

export async function getAdmins(
  params?: GetAdminsParams
): Promise<IApiResponse<GetAdminsResponse>> {
  return api.get<GetAdminsResponse>("/admin/admins", { params });
}

export async function createAdmin(
  payload: CreateAdminPayload
): Promise<IApiResponse<{ user: User }>> {
  return api.post<{ user: User }>("/admin/admins", payload);
}

export async function updateAdmin(
  id: string,
  payload: UpdateAdminPayload
): Promise<IApiResponse<{ admin: AdminTeamMember }>> {
  return api.patch<{ admin: AdminTeamMember }>(`/admin/admins/${id}`, payload);
}

export async function revokeAdmin(id: string): Promise<IApiResponse<null>> {
  return api.delete<null>(`/admin/admins/${id}`);
}
