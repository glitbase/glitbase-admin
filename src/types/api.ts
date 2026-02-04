// API Types based on PRD

export interface IApiResponse<T = Record<string, any>> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type UserRole = "admin" | "vendor" | "customer";

export type VendorOnboardingStatus = "pending" | "completed" | "approved" | "rejected";

export type SubscriptionType = "none" | "commission" | "monthly" | "yearly";

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  roles: UserRole[];
  activeRole: UserRole;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  countryName?: string;
  countryCode?: string;
  vendorOnboardingStatus?: VendorOnboardingStatus;
  subscriptionType?: SubscriptionType;
  isSubscriptionActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  status: ApprovalStatus;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationInMinutes: number;
  imageUrl?: string;
  images: string[];
  category: string;
  store: {
    id: string;
    name: string;
  };
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  status: ApprovalStatus;
  rejectionReason?: string;
  isDeleted: boolean;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  type: ("physical" | "mobile")[];
  status: string;
  location?: {
    address: string;
    city: string;
    state: string;
    zipcode: string;
    coordinates: [number, number];
  };
  bannerImageUrl?: string;
  gallery: string[];
  viewCount: number;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  bookingReference: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    owner: {
      id: string;
      name: string;
    };
  };
  serviceType: string;
  serviceDate: Date;
  serviceTime: string;
  pricing: {
    subtotal: number;
    amountPaid: number;
    remainingBalance: number;
    currency: string;
  };
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  paymentReference: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  paymentType: "booking" | "subscription" | "product" | "wallet_topup";
  status: PaymentStatus;
  paymentMethod: "card" | "bank_transfer" | "wallet";
  paymentGateway: "stripe" | "paystack";
  amount: number;
  currency: "NGN" | "GBP" | "USD";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  targetType: "user" | "store" | "product" | "service" | "review" | "glit";
  targetId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewNote?: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeReports: number;
}
