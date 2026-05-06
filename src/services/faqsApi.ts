import { api } from "./baseQuery";
import { IApiResponse, FAQ } from "@/types/api";

export interface CreateFAQPayload {
  question: string;
  answer: string;
  order?: number;
}

export interface UpdateFAQPayload {
  question?: string;
  answer?: string;
  order?: number;
}

/**
 * List all FAQs sorted by order — API returns data as a plain FAQ array
 */
export async function getFAQs(): Promise<IApiResponse<FAQ[]>> {
  return api.get<FAQ[]>("/faqs");
}

/**
 * Get single FAQ by ID
 */
export async function getFAQById(id: string): Promise<IApiResponse<{ faq: FAQ }>> {
  return api.get<{ faq: FAQ }>(`/faqs/${id}`);
}

/**
 * Create a new FAQ (Admin only)
 */
export async function createFAQ(payload: CreateFAQPayload): Promise<IApiResponse<{ faq: FAQ }>> {
  return api.post<{ faq: FAQ }>("/faqs", payload);
}

/**
 * Update an existing FAQ (Admin only)
 */
export async function updateFAQ(id: string, payload: UpdateFAQPayload): Promise<IApiResponse<{ faq: FAQ }>> {
  return api.patch<{ faq: FAQ }>(`/faqs/${id}`, payload);
}

/**
 * Delete a FAQ (Admin only)
 */
export async function deleteFAQ(id: string): Promise<IApiResponse<Record<string, never>>> {
  return api.delete<Record<string, never>>(`/faqs/${id}`);
}
