// API Types based on PRD

export interface IApiResponse<T = Record<string, unknown>> {
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

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PayoutStatus = "pending_approval" | "approved" | "processing" | "completed" | "failed" | "cancelled";

export type PayoutMethod = "bank_transfer" | "mobile_money" | "paypal" | "stripe_connect";

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
  user: string; // User ID
  store: {
    id: string;
    name: string;
    bannerImageUrl?: string;
    location?: {
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
  serviceType: string;
  serviceDate: Date;
  serviceTime: string;
  contactInfo: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  pricing: {
    subtotal: number;
    amountPaid: number;
    remainingBalance: number;
    currency: string;
  };
  payment: {
    paymentReference: string;
    status: string;
    paidAt?: Date;
  };
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  paymentReference: string;
  user: string; // User ID
  paymentType: "booking" | "subscription" | "product" | "wallet_topup";
  status: PaymentStatus;
  paymentMethod: "card" | "bank_transfer" | "wallet";
  paymentGateway: "stripe" | "paystack";
  amount: number;
  currency: "NGN" | "GBP" | "USD";
  metadata?: {
    contactInfo?: {
      name: string;
      email: string;
      phoneNumber?: string;
    };
    [key: string]: unknown;
  };
  gatewayCardId?: string;
  gatewayCustomerId?: string;
  gatewayPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  transactionId: string;
  transactionReference: string;
  payoutReference: string;
  wallet: {
    vendor: string; // Vendor ID
    pendingBalance: number;
    availableBalance: number;
    totalLifetimeEarnings: number;
    currency: "NGN" | "GBP" | "USD";
    id: string;
  };
  amount: number;
  currency: "NGN" | "GBP" | "USD";
  status: PayoutStatus;
  category: string;
  payoutMethod: PayoutMethod;
  paymentGateway: "stripe" | "paystack";
  bankAccount: {
    accountName: string;
    accountNumber: string; // Masked
    bankName: string;
    sortCode?: string; // For UK banks
    bankCode?: string; // For Nigerian banks
  };
  requestedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  planId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: "NGN" | "GBP" | "USD";
  };
  subscriptionType: SubscriptionType;
  status: SubscriptionStatus;
  amount: number;
  currency: string; // API returns lowercase sometimes (e.g., "gbp")
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  type: "user" | "store" | "product" | "service" | "review" | "glit";
  targetId: string;
  title: string;
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

export interface MarketplaceCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  type: "product" | "service";
  subcategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InspirationCategory {
  id: string;
  title: string;
  emoji?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  type?: "stylesInspo" | "touchupsTransformations";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: "monthly" | "yearly";
  price: number;
  currency: string;
  description: string;
  durationInMonths: number;
  isActive: boolean;
  stripePriceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendedProvider {
  id: string;
  businessName: string;
  businessType: string;
  contact: string;
  city: string;
  location?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Glit {
  _id: string;
  id?: string; // For compatibility
  user: string; // User ID
  glitProfile?: {
    _id: string;
    user: string;
    profilePicture?: string;
    username: string;
    dateOfBirth?: Date;
    bio?: string;
    isPrivate: boolean;
    followers?: string[];
    following?: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  creatorType?: string;
  image?: string;
  images?: string[];
  videos?: string[];
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  creatorCredited?: boolean;
  isPrivate: boolean;
  likes: number;
  saves: number;
  views: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlitfinderCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = "credit" | "debit" | "transfer";
export type TransactionReferenceType = "booking" | "payment" | "payout";

export interface Transaction {
  id: string;
  transactionReference: string;
  referenceNumber?: string;
  type: TransactionType;
  category: string; // TransactionCategory enum
  amount: number;
  currency: "NGN" | "GBP" | "USD";
  referenceType?: TransactionReferenceType;
  description?: string;
  wallet: {
    id: string;
    vendor: string; // Vendor ID
    pendingBalance: number;
    availableBalance: number;
    totalLifetimeEarnings: number;
    currency: "NGN" | "GBP" | "USD";
  };
  vendor?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
