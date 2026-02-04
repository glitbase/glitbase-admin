import { IApiResponse } from "@/types/api";

/**
 * Base API client for making HTTP requests
 * Handles authentication, error handling, and response parsing
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

if (!API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set in environment variables");
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Get authentication token from storage
 * Checks Redux store (via localStorage) first, then falls back to direct localStorage access
 */
function getAuthToken(): string | null {
  try {
    // Try to get from Redux store (stored in localStorage)
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.accessToken) {
          return parsed.state.accessToken;
        }
      } catch {
        // If parsing fails, continue to fallback
      }
    }
    // Fallback to direct localStorage access (for backward compatibility)
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

/**
 * Set authentication token in storage
 */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem("auth_token", token);
  } catch (error) {
    console.error("Failed to save auth token:", error);
  }
}

/**
 * Remove authentication token from storage
 */
export function removeAuthToken(): void {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
  } catch (error) {
    console.error("Failed to remove auth token:", error);
  }
}

/**
 * Set refresh token in storage
 */
export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem("refresh_token", token);
  } catch (error) {
    console.error("Failed to save refresh token:", error);
  }
}

/**
 * Get refresh token from storage
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem("refresh_token");
  } catch {
    return null;
  }
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Base fetch wrapper with authentication and error handling
 */
export async function baseQuery<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<IApiResponse<T>> {
  const { skipAuth = false, params, ...fetchConfig } = config;

  // Build URL with query parameters
  const url = buildUrl(endpoint, params);

  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchConfig.headers,
  };

  // Add authentication token if available
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: IApiResponse<T> = await response.json();

    // Handle API-level errors
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error: Please check your internet connection");
    }

    // Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }

    // Handle unknown errors
    throw new Error("An unexpected error occurred");
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, config?: RequestConfig) =>
    baseQuery<T>(endpoint, { ...config, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    baseQuery<T>(endpoint, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    baseQuery<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    baseQuery<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, config?: RequestConfig) =>
    baseQuery<T>(endpoint, { ...config, method: "DELETE" }),
};

