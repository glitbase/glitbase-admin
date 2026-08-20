import { api } from "./baseQuery";
import { IApiResponse, Invite, InviteMetadata, PaginationMeta } from "@/types/api";

export interface GetInvitesParams {
  page?: number;
  limit?: number;
  status?: Invite["status"];
  role?: Invite["role"];
}

export interface GetInvitesResponse {
  invites: Invite[];
  meta: PaginationMeta;
}

export interface CreateInvitePayload {
  role: Invite["role"];
  email?: string;
  expiresInDays?: number;
  maxUses?: number;
  sendEmail?: boolean;
  metadata?: InviteMetadata;
}

export interface CreateInviteResponse {
  invite: Invite;
  token?: string;
  inviteUrl?: string;
}

export async function getInvites(
  params?: GetInvitesParams
): Promise<IApiResponse<GetInvitesResponse>> {
  return api.get<GetInvitesResponse>("/admin/invites", { params });
}

export async function createInvite(
  payload: CreateInvitePayload
): Promise<IApiResponse<CreateInviteResponse>> {
  return api.post<CreateInviteResponse>("/admin/invites", payload);
}

export async function resendInvite(id: string): Promise<IApiResponse<{ invite: Invite }>> {
  return api.post<{ invite: Invite }>(`/admin/invites/${id}/resend`);
}

export async function revokeInvite(id: string): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/admin/invites/${id}`);
}
