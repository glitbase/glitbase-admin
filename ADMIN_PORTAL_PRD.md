# Admin Portal API Documentation & PRD

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Features](#core-features)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

---

## Overview

This document provides comprehensive API documentation for building the Admin Portal frontend. The admin portal allows administrators to manage users, content, bookings, payments, subscriptions, and other platform operations.

### Base URL
All endpoints are relative to the base API URL (configured in environment).

### Authentication
All admin endpoints require:
- JWT Access Token in Authorization header: `Authorization: Bearer <token>`
- User must have `activeRole: "admin"` in their JWT payload
- Cookies may also be used for token storage (accessToken, refreshToken)

### Response Format
All endpoints return a standardized response format:
```typescript
interface IApiResponse {
  status: boolean;
  message: string;
  data: Record<string, any>;
}
```

### Pagination
Most list endpoints support pagination with the following query parameters:
- `page` (number, default: 1)
- `limit` (number, default: 20)

Pagination response includes:
```typescript
{
  status: true,
  message: string,
  data: {
    items: any[],
    meta: {
      totalDocs: number,
      limit: number,
      page: number,
      totalPages: number,
      hasNextPage: boolean,
      hasPrevPage: boolean
    }
  }
}
```

---

## Authentication

### Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Logged in successfully",
  data: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      roles: UserRole[];
      activeRole: UserRole;
      profileImageUrl?: string;
      // ... other user fields
    },
    tokens: {
      accessToken: string;
      refreshToken: string;
    }
  }
}
```

**Note:** Tokens are also set as HTTP-only cookies.

### Refresh Token
**Endpoint:** `POST /auth/refresh-user-token`

**Headers:** 
- `Authorization: Bearer <refreshToken>` OR cookie with refreshToken

**Response:** Same as login response with new tokens.

### Logout
**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**
```typescript
{
  status: true,
  message: "Logged out successfully",
  data: {}
}
```

### Switch Role (if admin has multiple roles)
**Endpoint:** `POST /auth/switch-role`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```typescript
{
  role: "admin" | "vendor" | "customer"
}
```

**Response:** Same as login with updated tokens.

---

## Core Features

The admin portal should include the following main sections:

1. **Dashboard** - Overview metrics and statistics
2. **User Management** - View, search, and manage users
3. **Product Management** - Approve/reject products, view all products
4. **Service Management** - Approve/reject services, view all services
5. **Store Management** - View and manage vendor stores
6. **Booking Management** - View all bookings, booking analytics
7. **Payment Management** - View all payments, payment analytics
8. **Subscription Management** - Manage subscription plans, view vendor subscriptions
9. **Category Management** - Manage marketplace and inspiration categories
10. **Report Management** - View and resolve user reports
11. **Review Management** - View and moderate reviews
12. **Content Management** - Manage glits, glit profiles, glitboards

---

## API Endpoints

### 1. User Management

#### Get All Users
**Endpoint:** `GET /users`

**Authorization:** Admin only

**Query Parameters:**
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  searchTerm?: string;         // Search by name, email
  role?: "admin" | "vendor" | "customer";
  vendorOnboardingStatus?: "pending" | "completed" | "approved" | "rejected";
  countryName?: string;
  startDate?: string;         // ISO date string
  endDate?: string;           // ISO date string
}
```

**Response:**
```typescript
{
  status: true,
  message: "Users retrieved successfully",
  data: {
    users: User[],
    meta: PaginationMeta
  }
}
```

**User Object:**
```typescript
{
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
  // ... other fields
}
```

#### Get User by ID
**Endpoint:** `GET /users/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "User retrieved successfully",
  data: {
    user: User
  }
}
```

---

### 2. Product Management

#### Get All Products (Admin View)
**Endpoint:** `GET /products`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  searchTerm?: string;
  vendorId?: string;
  categoryId?: string;
  isDeleted?: boolean;        // Include soft-deleted products
}
```

**Response:**
```typescript
{
  status: true,
  message: "Products retrieved successfully",
  data: {
    products: Product[],
    meta: PaginationMeta
  }
}
```

**Product Object:**
```typescript
{
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
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Product by ID
**Endpoint:** `GET /products/:id`

**Response:**
```typescript
{
  status: true,
  message: "Product retrieved successfully",
  data: {
    product: Product
  }
}
```

#### Approve Product
**Endpoint:** `PATCH /products/:id/approve`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Product approved successfully",
  data: {
    product: Product
  }
}
```

#### Reject Product
**Endpoint:** `PATCH /products/:id/reject`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  rejectionReason: string;    // Required, reason for rejection
}
```

**Response:**
```typescript
{
  status: true,
  message: "Product rejected successfully",
  data: {
    product: Product
  }
}
```

#### Soft Delete Product
**Endpoint:** `PATCH /products/:id/soft-delete`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Product deleted successfully",
  data: {
    product: Product
  }
}
```

#### Restore Product
**Endpoint:** `PATCH /products/:id/restore`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Product restored successfully",
  data: {
    product: Product
  }
}
```

#### Hard Delete Product
**Endpoint:** `DELETE /products/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Product permanently deleted",
  data: {}
}
```

---

### 3. Service Management

#### Get All Services (Admin View)
**Endpoint:** `GET /services`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  searchTerm?: string;
  vendorId?: string;
  storeId?: string;
  categoryId?: string;
  isDeleted?: boolean;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Services retrieved successfully",
  data: {
    services: Service[],
    meta: PaginationMeta
  }
}
```

**Service Object:**
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;           // Duration in minutes
  images: string[];
  category: {
    id: string;
    name: string;
  };
  store: {
    id: string;
    name: string;
  };
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isDeleted: boolean;
  isSuspended: boolean;
  addOns?: AddOn[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Service by ID
**Endpoint:** `GET /services/:id`

**Response:**
```typescript
{
  status: true,
  message: "Service retrieved successfully",
  data: {
    service: Service
  }
}
```

#### Approve Service
**Endpoint:** `PATCH /services/:id/approve`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Service approved successfully",
  data: {
    service: Service
  }
}
```

#### Reject Service
**Endpoint:** `PATCH /services/:id/reject`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  rejectionReason: string;     // Required
}
```

**Response:**
```typescript
{
  status: true,
  message: "Service rejected successfully",
  data: {
    service: Service
  }
}
```

#### Soft Delete Service
**Endpoint:** `PATCH /services/:id/soft-delete`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Service deleted successfully",
  data: {
    service: Service
  }
}
```

#### Restore Service
**Endpoint:** `PATCH /services/:id/restore`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Service restored successfully",
  data: {
    service: Service
  }
}
```

#### Delete Service
**Endpoint:** `DELETE /services/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Service deleted successfully",
  data: {}
}
```

---

### 4. Store Management

#### Get All Stores
**Endpoint:** `GET /stores`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  searchTerm?: string;
  vendorId?: string;
  countryName?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Stores retrieved successfully",
  data: {
    stores: Store[],
    meta: PaginationMeta
  }
}
```

**Store Object:**
```typescript
{
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    zipcode: string;
    coordinates: [number, number];
  };
  gallery: string[];
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  viewCount: number;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Store by ID
**Endpoint:** `GET /stores/:storeId`

**Response:**
```typescript
{
  status: true,
  message: "Store retrieved successfully",
  data: {
    store: Store
  }
}
```

---

### 5. Booking Management

#### Get All Bookings (Admin View)
**Note:** Currently, there's no dedicated admin endpoint for all bookings. You may need to:
1. Use the vendor bookings endpoint with admin privileges, OR
2. Request backend team to add: `GET /bookings/admin/all`

**Potential Endpoint:** `GET /bookings/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  vendorId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Bookings retrieved successfully",
  data: {
    bookings: Booking[],
    meta: PaginationMeta
  }
}
```

**Booking Object:**
```typescript
{
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
  items: Array<{
    serviceId: string;
    serviceName: string;
    quantity: number;
    price: number;
    addOns?: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
  pricing: {
    subtotal: number;
    totalDuration: number;
    paymentTerm: string;
    depositPercentage?: number;
    amountPaid: number;
    remainingBalance: number;
    currency: string;
    commissionRate?: number;
    commissionAmount?: number;
    vendorPayout?: number;
    serviceChargeRate?: number;
    serviceChargeAmount?: number;
    platformRevenue?: number;
  };
  payment: {
    paymentReference: string;
    status: "pending" | "completed" | "failed" | "refunded";
    paymentMethod: string;
    amount: number;
    currency: string;
  };
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  bookingStage: "pending" | "confirmed" | "in_progress" | "completed";
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  homeServiceAddress?: AddressInfo;
  pickupInfo?: PickupDropoffInfo;
  dropoffInfo?: PickupDropoffInfo;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Booking by Reference
**Endpoint:** `GET /bookings/:reference`

**Authorization:** Admin (should have access)

**Response:**
```typescript
{
  status: true,
  message: "Booking retrieved successfully",
  data: {
    booking: Booking
  }
}
```

---

### 6. Payment Management

#### Get All Payments (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /payments/admin/all`

**Potential Endpoint:** `GET /payments/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "pending" | "completed" | "failed" | "refunded";
  paymentMethod?: string;
  paymentGateway?: "stripe" | "paystack";
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: "NGN" | "GBP" | "USD";
}
```

**Response:**
```typescript
{
  status: true,
  message: "Payments retrieved successfully",
  data: {
    payments: Payment[],
    meta: PaginationMeta
  }
}
```

**Payment Object:**
```typescript
{
  id: string;
  paymentReference: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  paymentType: "booking" | "subscription" | "product" | "wallet_topup";
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "card" | "bank_transfer" | "wallet";
  paymentGateway: "stripe" | "paystack";
  amount: number;
  currency: "NGN" | "GBP" | "USD";
  gatewayPaymentId?: string;
  gatewayCustomerId?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  failureCode?: string;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Payment by Reference
**Endpoint:** `GET /payments/:paymentReference`

**Authorization:** Admin (should have access)

**Response:**
```typescript
{
  status: true,
  message: "Payment retrieved successfully",
  data: {
    payment: Payment
  }
}
```

---

### 7. Subscription Plan Management

#### Create Subscription Plan
**Endpoint:** `POST /subscription-plans`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  name: string;                    // e.g., "Premium Monthly"
  type: "monthly" | "yearly";
  price: number;                    // Must be positive
  currency: string;                 // e.g., "GBP", "USD", "NGN"
  description: string;
  durationInMonths: number;         // Must be >= 1
  isActive?: boolean;               // Default: true
  stripePriceId?: string;           // Stripe price ID if integrated
}
```

**Response:**
```typescript
{
  status: true,
  message: "Subscription plan created successfully",
  data: {
    plan: SubscriptionPlan
  }
}
```

#### Get All Subscription Plans
**Endpoint:** `GET /subscription-plans`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: "monthly" | "yearly";
  isActive?: boolean;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Subscription plans retrieved successfully",
  data: {
    plans: SubscriptionPlan[],
    meta: PaginationMeta
  }
}
```

**SubscriptionPlan Object:**
```typescript
{
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
```

#### Get Active Plans
**Endpoint:** `GET /subscription-plans/active`

**Response:**
```typescript
{
  status: true,
  message: "Active subscription plans retrieved successfully",
  data: SubscriptionPlan[]
}
```

#### Get Plan by ID
**Endpoint:** `GET /subscription-plans/:id`

**Response:**
```typescript
{
  status: true,
  message: "Subscription plan retrieved successfully",
  data: {
    plan: SubscriptionPlan
  }
}
```

#### Update Subscription Plan
**Endpoint:** `PATCH /subscription-plans/:id`

**Authorization:** Admin only

**Request Body:** (All fields optional)
```typescript
{
  name?: string;
  price?: number;
  currency?: string;
  description?: string;
  durationInMonths?: number;
  isActive?: boolean;
  stripePriceId?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Subscription plan updated successfully",
  data: {
    plan: SubscriptionPlan
  }
}
```

#### Delete Subscription Plan
**Endpoint:** `DELETE /subscription-plans/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Subscription plan deleted successfully",
  data: {}
}
```

#### Get All Vendor Subscriptions (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /subscriptions/admin/all`

**Potential Endpoint:** `GET /subscriptions/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "active" | "past_due" | "canceled" | "incomplete";
  vendorId?: string;
  planId?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Subscriptions retrieved successfully",
  data: {
    subscriptions: Subscription[],
    meta: PaginationMeta
  }
}
```

**Subscription Object:**
```typescript
{
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: string;
  plan: SubscriptionPlan;
  subscriptionType: "monthly" | "yearly";
  status: "active" | "past_due" | "canceled" | "incomplete";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  canceledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 8. Marketplace Category Management

#### Create Marketplace Category
**Endpoint:** `POST /marketplace-categories`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  name: string;                    // Required
  description?: string;
  imageUrl?: string;
  icon?: string;
  type: "product" | "service";    // Required
  subcategories: string[];         // Required, at least 1 item
}
```

**Response:**
```typescript
{
  status: true,
  message: "Marketplace category created successfully",
  data: {
    category: MarketplaceCategory
  }
}
```

#### Get All Marketplace Categories
**Endpoint:** `GET /marketplace-categories`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: "product" | "service";
  searchTerm?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Marketplace categories retrieved successfully",
  data: {
    categories: MarketplaceCategory[],
    meta: PaginationMeta
  }
}
```

**MarketplaceCategory Object:**
```typescript
{
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
```

#### Get Marketplace Category by ID
**Endpoint:** `GET /marketplace-categories/:id`

**Response:**
```typescript
{
  status: true,
  message: "Marketplace category retrieved successfully",
  data: {
    category: MarketplaceCategory
  }
}
```

#### Update Marketplace Category
**Endpoint:** `PATCH /marketplace-categories/:id`

**Authorization:** Admin only

**Request Body:** (All fields optional)
```typescript
{
  name?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  type?: "product" | "service";
  subcategories?: string[];
}
```

**Response:**
```typescript
{
  status: true,
  message: "Marketplace category updated successfully",
  data: {
    category: MarketplaceCategory
  }
}
```

#### Delete Marketplace Category
**Endpoint:** `DELETE /marketplace-categories/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Marketplace category deleted successfully",
  data: {}
}
```

---

### 9. Inspiration Category Management

#### Create Inspiration Category
**Endpoint:** `POST /inspiration-categories/admin`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  name: string;                    // Required
  description?: string;
  imageUrl?: string;
  icon?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Inspiration category created successfully",
  data: {
    category: InspirationCategory
  }
}
```

#### Get All Inspiration Categories (Admin View)
**Endpoint:** `GET /inspiration-categories/admin`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Categories retrieved successfully",
  data: InspirationCategory[]
}
```

**InspirationCategory Object:**
```typescript
{
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Inspiration Category by ID
**Endpoint:** `GET /inspiration-categories/admin/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Category retrieved successfully",
  data: {
    category: InspirationCategory
  }
}
```

#### Update Inspiration Category
**Endpoint:** `PUT /inspiration-categories/admin/:id`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Category updated successfully",
  data: {
    category: InspirationCategory
  }
}
```

#### Delete Inspiration Category
**Endpoint:** `DELETE /inspiration-categories/admin/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Category deleted successfully",
  data: {}
}
```

---

### 10. Report Management

#### Get All Reports
**Endpoint:** `GET /reports/admin/all`

**Authorization:** Admin only

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: string;                   // Report type (e.g., "user", "store", "product", "service")
  status?: "pending" | "reviewing" | "resolved" | "dismissed";
}
```

**Response:**
```typescript
{
  status: true,
  message: "Reports retrieved successfully",
  data: {
    reports: Report[],
    meta: PaginationMeta
  }
}
```

**Report Object:**
```typescript
{
  id: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  targetType: "user" | "store" | "product" | "service" | "review" | "glit";
  targetId: string;
  target?: any;                    // The reported entity
  reason: string;
  description?: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  reviewNote?: string;              // Admin's review note
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Report by ID
**Endpoint:** `GET /reports/admin/:id`

**Authorization:** Admin only

**Response:**
```typescript
{
  status: true,
  message: "Report retrieved successfully",
  data: {
    report: Report
  }
}
```

#### Update Report Status
**Endpoint:** `PATCH /reports/admin/:id`

**Authorization:** Admin only

**Request Body:**
```typescript
{
  status: "pending" | "reviewing" | "resolved" | "dismissed";  // Required
  reviewNote?: string;                                          // Max 1000 characters
}
```

**Response:**
```typescript
{
  status: true,
  message: "Report status updated successfully",
  data: {
    report: Report
  }
}
```

#### Get Reports by Target
**Endpoint:** `GET /reports/admin/target/:targetId`

**Authorization:** Admin only

**Query Parameters:**
```typescript
{
  type?: string;                 // Filter by report type
}
```

**Response:**
```typescript
{
  status: true,
  message: "Reports retrieved successfully",
  data: {
    reports: Report[]
  }
}
```

---

### 11. Review Management

#### Get All Reviews (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /reviews/admin/all`

**Potential Endpoint:** `GET /reviews/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  storeId?: string;
  userId?: string;
  rating?: number;               // Filter by rating (1-5)
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Reviews retrieved successfully",
  data: {
    reviews: Review[],
    meta: PaginationMeta
  }
}
```

**Review Object:**
```typescript
{
  id: string;
  store: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  rating: number;                 // 1-5
  comment?: string;
  images?: string[];
  helpfulCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 12. Content Management (Glits, Glit Profiles, Glitboards)

#### Get All Glits (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /glits/admin/all`

**Potential Endpoint:** `GET /glits/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  userId?: string;
  category?: string;
  isPrivate?: boolean;
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Glits retrieved successfully",
  data: {
    glits: Glit[],
    meta: PaginationMeta
  }
}
```

**Glit Object:**
```typescript
{
  id: string;
  creator: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  glitProfile?: {
    id: string;
    username: string;
  };
  content: string;
  images?: string[];
  videos?: string[];
  category?: {
    id: string;
    name: string;
  };
  tags?: string[];
  isPrivate: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  savedCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get All Glit Profiles (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /glit-profiles/admin/all`

**Potential Endpoint:** `GET /glit-profiles/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  category?: string;
  isVerified?: boolean;
  searchTerm?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Glit profiles retrieved successfully",
  data: {
    profiles: GlitProfile[],
    meta: PaginationMeta
  }
}
```

**GlitProfile Object:**
```typescript
{
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  username: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  category?: {
    id: string;
    name: string;
  };
  isVerified: boolean;
  isPro: boolean;
  followerCount: number;
  followingCount: number;
  glitCount: number;
  glitboardCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 13. Wallet Management (Vendor Wallets)

#### Get All Wallets (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /wallet/admin/all`

**Potential Endpoint:** `GET /wallet/admin/all`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  vendorId?: string;
  minBalance?: number;
  maxBalance?: number;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Wallets retrieved successfully",
  data: {
    wallets: Wallet[],
    meta: PaginationMeta
  }
}
```

**Wallet Object:**
```typescript
{
  id: string;
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  balance: number;
  currency: string;
  pendingPayout?: number;
  totalEarnings: number;
  totalPayouts: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get Wallet Transactions (Admin View)
**Note:** Currently, there's no dedicated admin endpoint. You may need to:
1. Request backend team to add: `GET /wallet/admin/transactions`

**Potential Endpoint:** `GET /wallet/admin/transactions`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  vendorId?: string;
  type?: "credit" | "debit";
  period?: "daily" | "weekly" | "monthly" | "yearly";
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  status: true,
  message: "Transactions retrieved successfully",
  data: {
    transactions: Transaction[],
    meta: PaginationMeta
  }
}
```

**Transaction Object:**
```typescript
{
  id: string;
  wallet: {
    id: string;
    vendorId: string;
  };
  type: "credit" | "debit";
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  status: "pending" | "completed" | "failed";
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## Data Models

### Enums

#### UserRole
```typescript
enum UserRole {
  Admin = "admin",
  Vendor = "vendor",
  Customer = "customer"
}
```

#### VendorOnboardingStatus
```typescript
enum VendorOnboardingStatus {
  Pending = "pending",
  Completed = "completed",
  Approved = "approved",
  Rejected = "rejected"
}
```

#### SubscriptionType
```typescript
enum SubscriptionType {
  None = "none",
  Commission = "commission",
  Monthly = "monthly",
  Yearly = "yearly"
}
```

#### BookingStatus
```typescript
enum BookingStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  Rejected = "rejected"
}
```

#### PaymentStatus
```typescript
enum PaymentStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
  Refunded = "refunded"
}
```

#### ReportStatus
```typescript
enum ReportStatus {
  Pending = "pending",
  Reviewing = "reviewing",
  Resolved = "resolved",
  Dismissed = "dismissed"
}
```

#### MarketplaceCategoryType
```typescript
enum MarketplaceCategoryType {
  Product = "product",
  Service = "service"
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate entry)
- `500 Internal Server Error` - Server error

### Common Error Scenarios

#### Unauthorized Access
```typescript
{
  statusCode: 401,
  message: "Unauthorized",
  error: "Invalid or expired token"
}
```

#### Forbidden (Insufficient Permissions)
```typescript
{
  statusCode: 403,
  message: "Forbidden resource",
  error: "User does not have admin role"
}
```

#### Resource Not Found
```typescript
{
  statusCode: 404,
  message: "User with ID {id} not found",
  error: "Not Found"
}
```

#### Validation Error
```typescript
{
  statusCode: 400,
  message: [
    "rejectionReason should not be empty",
    "rejectionReason must be a string"
  ],
  error: "Bad Request"
}
```

---

## Additional Notes

### Missing Admin Endpoints
The following admin endpoints may need to be implemented by the backend team:
1. `GET /bookings/admin/all` - Get all bookings
2. `GET /payments/admin/all` - Get all payments
3. `GET /subscriptions/admin/all` - Get all vendor subscriptions
4. `GET /reviews/admin/all` - Get all reviews
5. `GET /glits/admin/all` - Get all glits
6. `GET /glit-profiles/admin/all` - Get all glit profiles
7. `GET /wallet/admin/all` - Get all wallets
8. `GET /wallet/admin/transactions` - Get all wallet transactions

### Dashboard Metrics Endpoints
Consider requesting the following analytics endpoints:
1. `GET /admin/dashboard/stats` - Overall platform statistics
2. `GET /admin/dashboard/users` - User growth metrics
3. `GET /admin/dashboard/revenue` - Revenue analytics
4. `GET /admin/dashboard/bookings` - Booking analytics
5. `GET /admin/dashboard/products` - Product approval metrics
6. `GET /admin/dashboard/services` - Service approval metrics

### Rate Limiting
Be aware that the API may implement rate limiting. Check response headers for:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

### WebSocket/Real-time Updates
For real-time notifications, consider implementing WebSocket connections or polling mechanisms for:
- New user registrations
- Pending product/service approvals
- New reports
- Payment status updates

---

## Implementation Checklist

### Phase 1: Core Features
- [ ] Authentication & Authorization
- [ ] User Management (List, View, Search, Filter)
- [ ] Product Management (List, View, Approve, Reject)
- [ ] Service Management (List, View, Approve, Reject)
- [ ] Store Management (List, View)

### Phase 2: Financial Management
- [ ] Booking Management (List, View, Filter)
- [ ] Payment Management (List, View, Filter)
- [ ] Subscription Plan Management (CRUD)
- [ ] Wallet Management (View wallets, transactions)

### Phase 3: Content & Category Management
- [ ] Marketplace Category Management (CRUD)
- [ ] Inspiration Category Management (CRUD)
- [ ] Report Management (List, View, Update Status)
- [ ] Review Management (List, View)

### Phase 4: Advanced Features
- [ ] Dashboard with Analytics
- [ ] Content Management (Glits, Glit Profiles)
- [ ] Advanced Search & Filtering
- [ ] Bulk Operations
- [ ] Export Functionality (CSV, PDF)

---

## Support & Contact

For questions or clarifications about API endpoints, contact the backend development team.

**Last Updated:** [Current Date]
**API Version:** 1.0

