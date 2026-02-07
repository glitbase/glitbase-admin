import { api } from "./baseQuery";
import { IApiResponse } from "@/types/api";

/**
 * Glit Profile API endpoints
 */

export interface GlitProfile {
  id: string;
  user: string;
  profilePicture?: string;
  username: string;
  dateOfBirth?: string;
  bio?: string;
  isPrivate: boolean;
  usernameChangedLast?: string | null;
  followers?: string[];
  following?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GetGlitProfileByUserIdResponse {
  profile: GlitProfile;
}

/**
 * Get glit profile by user ID (Admin)
 */
export async function getGlitProfileByUserId(
  userId: string
): Promise<IApiResponse<GetGlitProfileByUserIdResponse>> {
  return api.get<GetGlitProfileByUserIdResponse>(`/glit-profiles/admin/user/${userId}`);
}

