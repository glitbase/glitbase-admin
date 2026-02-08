import { api } from "./baseQuery";
import { IApiResponse, Booking, PaginationMeta } from "@/types/api";

/**
 * Bookings API endpoints
 */

export interface GetBookingsParams {
  page?: number | string;
  limit?: number | string;
  status?: "pending" | "confirmed" | "ongoing" | "completed" | "rejected" | "refunded" | "cancelled";
  serviceType?: "normal" | "home" | "pickDrop";
  vendorId?: string;
  customerId?: string;
  minDuration?: number | string;
  maxDuration?: number | string;
  minValue?: number | string;
  maxValue?: number | string;
  search?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  sortBy?: "newest" | "oldest" | "customerName";
}

export interface GetBookingsResponse {
  bookings: Booking[];
  meta: PaginationMeta;
}

/**
 * Get all bookings with filters and pagination
 */
export async function getBookings(params?: GetBookingsParams): Promise<IApiResponse<GetBookingsResponse>> {
  // Convert params to strings where API expects strings
  const queryParams: Record<string, string | undefined> = {};
  
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);
  if (params?.status) queryParams.status = params.status;
  if (params?.serviceType) queryParams.serviceType = params.serviceType;
  if (params?.vendorId) queryParams.vendorId = params.vendorId;
  if (params?.customerId) queryParams.customerId = params.customerId;
  if (params?.minDuration !== undefined) queryParams.minDuration = String(params.minDuration);
  if (params?.maxDuration !== undefined) queryParams.maxDuration = String(params.maxDuration);
  if (params?.minValue !== undefined) queryParams.minValue = String(params.minValue);
  if (params?.maxValue !== undefined) queryParams.maxValue = String(params.maxValue);
  if (params?.search) queryParams.search = params.search;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.sortBy) queryParams.sortBy = params.sortBy;
  
  return api.get<GetBookingsResponse>("/bookings/admin/all", {
    params: queryParams,
  });
}

/**
 * Get booking by reference
 */
export async function getBookingById(reference: string): Promise<IApiResponse<{ booking: Booking }>> {
  return api.get<{ booking: Booking }>(`/bookings/${reference}`);
}

/**
 * Force Cancel Booking
 */
export interface ForceCancelBookingPayload {
  reason: string;
  refundType: "full" | "partial" | "none";
  customRefundAmount?: number;
  adminNotes?: string;
}

export interface ForceCancelBookingResponse {
  booking: Booking;
  refundAmount?: number;
  refundProcessed?: boolean;
}

export async function forceCancelBooking(
  reference: string,
  payload: ForceCancelBookingPayload
): Promise<IApiResponse<ForceCancelBookingResponse>> {
  return api.post<ForceCancelBookingResponse>(
    `/bookings/admin/${reference}/cancel`,
    payload
  );
}

/**
 * Manual Refund Processing
 */
export interface ManualRefundPayload {
  refundAmount: number;
  reason: string;
  adminNotes?: string;
  notifyCustomer?: boolean;
  notifyVendor?: boolean;
}

export interface ManualRefundResponse {
  booking: Booking;
  refundAmount: number;
  refundProcessed: boolean;
}

export async function manualRefund(
  reference: string,
  payload: ManualRefundPayload
): Promise<IApiResponse<ManualRefundResponse>> {
  return api.post<ManualRefundResponse>(
    `/bookings/admin/${reference}/refund`,
    payload
  );
}

/**
 * Update Booking Status
 */
export interface UpdateBookingStatusPayload {
  status: "pending" | "confirmed" | "ongoing" | "completed" | "rejected" | "refunded" | "cancelled";
  stage?: string;
  reason?: string;
  adminNotes?: string;
  notifyCustomer?: boolean;
  notifyVendor?: boolean;
}

export interface UpdateBookingStatusResponse {
  booking: Booking;
}

export async function updateBookingStatus(
  reference: string,
  payload: UpdateBookingStatusPayload
): Promise<IApiResponse<UpdateBookingStatusResponse>> {
  return api.patch<UpdateBookingStatusResponse>(
    `/bookings/admin/${reference}/status`,
    payload
  );
}

/**
 * Resolve Disputes
 */
export interface ResolveDisputePayload {
  resolution: "favor_customer" | "favor_vendor" | "split" | "no_action";
  resolutionNotes: string;
  customerRefundPercentage?: number;
  finalStatus?: "completed" | "cancelled" | "refunded";
  adminNotes?: string;
}

export interface ResolveDisputeResponse {
  booking: Booking;
  refundAmount?: number;
  refundProcessed?: boolean;
}

export async function resolveDispute(
  reference: string,
  payload: ResolveDisputePayload
): Promise<IApiResponse<ResolveDisputeResponse>> {
  return api.post<ResolveDisputeResponse>(
    `/bookings/admin/${reference}/resolve-dispute`,
    payload
  );
}


