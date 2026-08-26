import { api } from "./baseQuery";
import {
  IApiResponse,
  Announcement,
  AnnouncementType,
  AnnouncementStatus,
  PaginationMeta,
} from "@/types/api";

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  type?: AnnouncementType;
  status?: AnnouncementStatus;
  startDate?: string;
  endDate?: string;
}

export interface GetAnnouncementsResponse {
  announcements: Announcement[];
  meta: PaginationMeta;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  type: AnnouncementType;
  audience: Announcement["audience"];
  channels: Announcement["channels"];
  imageUrl?: string;
  actionUrl?: string;
}

export async function getAnnouncements(
  params?: GetAnnouncementsParams
): Promise<IApiResponse<GetAnnouncementsResponse>> {
  return api.get<GetAnnouncementsResponse>("/admin/announcements", { params });
}

export async function getAnnouncementById(
  id: string
): Promise<IApiResponse<{ announcement: Announcement }>> {
  return api.get<{ announcement: Announcement }>(`/admin/announcements/${id}`);
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<IApiResponse<{ announcement: Announcement }>> {
  return api.post<{ announcement: Announcement }>("/admin/announcements", payload);
}
