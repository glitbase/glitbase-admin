import { api } from "./baseQuery";
import { IApiResponse, PaginationMeta, WaitlistEntry, WaitlistUserType } from "@/types/api";

export interface GetWaitlistParams {
  page?: number;
  limit?: number;
  userType?: WaitlistUserType;
  search?: string;
}

export interface GetWaitlistResponse {
  entries: WaitlistEntry[];
  meta: PaginationMeta;
}

export async function getWaitlistEntries(
  params?: GetWaitlistParams
): Promise<IApiResponse<GetWaitlistResponse>> {
  return api.get<GetWaitlistResponse>("/admin/waitlist", { params });
}

export async function getWaitlistEntryById(
  id: string
): Promise<IApiResponse<WaitlistEntry>> {
  const response = await api.get<WaitlistEntry>(`/admin/waitlist/${id}`);
  return response;
}
