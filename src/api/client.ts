/**
 * Equal Dating App — Base API Client
 *
 * A lightweight, type-safe fetch wrapper that handles:
 * - JWT Bearer token injection from localStorage
 * - Automatic JSON serialization / deserialization
 * - Consistent error handling via ApiError
 * - Request / response interceptors for logging & auth refresh
 */

// ───────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

/** Storage key used for the JWT access token */
export const TOKEN_KEY = 'equal_token';

/** Storage key used for the refresh token */
export const REFRESH_TOKEN_KEY = 'equal_refresh_token';

// ───────────────────────────────────────────────────────────
// ERROR HANDLING
// ───────────────────────────────────────────────────────────

/**
 * Structured API error thrown on every non-2xx response.
 * Consumers can inspect `status` to implement conditional retry / logout logic.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code: string = 'unknown_error',
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Fix prototype chain for `instanceof` checks across transpilers
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True when the server responded with 401 Unauthorized */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True when the server responded with 403 Forbidden */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True for network-level failures (fetch threw) */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

// ───────────────────────────────────────────────────────────
// INTERCEPTOR TYPES
// ───────────────────────────────────────────────────────────

export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => RequestInit | Promise<RequestInit>;

export type ResponseInterceptor = <T>(
  response: ApiResponse<T>,
  url: string,
) => ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorInterceptor = (error: ApiError, url: string) => void | Promise<void>;

// ───────────────────────────────────────────────────────────
// RESPONSE WRAPPER
// ───────────────────────────────────────────────────────────

/**
 * Normalized wrapper around every successful HTTP call.
 * Always contains the parsed JSON body + metadata about the request.
 */
export interface ApiResponse<T> {
  /** Parsed response body */
  data: T;
  /** HTTP status code */
  status: number;
  /** Raw Response headers (useful for pagination) */
  headers: Headers;
  /** True when status is in the 2xx range */
  ok: boolean;
}

// ───────────────────────────────────────────────────────────
// API CLIENT
// ───────────────────────────────────────────────────────────

class ApiClient {
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  // ── Interceptor registration ─────────────────────────────

  /** Register a function that can modify outgoing requests */
  onRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor);
    };
  }

  /** Register a function that can inspect / transform successful responses */
  onResponse(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor);
    };
  }

  /** Register a function that is called on every ApiError */
  onError(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      this.errorInterceptors = this.errorInterceptors.filter((i) => i !== interceptor);
    };
  }

  // ── Public HTTP verbs ────────────────────────────────────

  /**
   * Perform a GET request.
   * @param path   URL path (appended to baseURL)
   * @param init   Optional fetch overrides
   */
  async get<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, init);
  }

  /**
   * Perform a POST request with a JSON body.
   * @param path   URL path
   * @param body   Serializable request payload
   * @param init   Optional fetch overrides
   */
  async post<T>(path: string, body: unknown, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, init);
  }

  /**
   * Perform a PATCH request with a JSON body.
   * @param path   URL path
   * @param body   Serializable request payload
   * @param init   Optional fetch overrides
   */
  async patch<T>(path: string, body: unknown, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, init);
  }

  /**
   * Perform a PUT request with a JSON body.
   * @param path   URL path
   * @param body   Serializable request payload
   * @param init   Optional fetch overrides
   */
  async put<T>(path: string, body: unknown, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, init);
  }

  /**
   * Perform a DELETE request.
   * @param path   URL path
   * @param init   Optional fetch overrides
   */
  async delete<T = void>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, init);
  }

  /**
   * Perform a multipart/form-data POST (used for photo uploads).
   * @param path   URL path
   * @param form   FormData instance (caller must populate fields)
   * @param init   Optional fetch overrides
   */
  async postForm<T>(path: string, form: FormData, init: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.requestForm<T>('POST', path, form, init);
  }

  // ── Internal request machinery ───────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`;

    const token = localStorage.getItem(TOKEN_KEY);

    const defaultHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Only set Content-Type for JSON bodies; FormData needs browser-boundary
    if (!(body instanceof FormData) && body !== undefined) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    let requestInit: RequestInit = {
      method,
      headers: { ...defaultHeaders, ...(init.headers as Record<string, string> || {}) },
      ...init,
    };

    if (body !== undefined && !(body instanceof FormData)) {
      requestInit.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      requestInit.body = body;
      // Remove Content-Type so the browser sets the multipart boundary
      delete (requestInit.headers as Record<string, string>)?.['Content-Type'];
    }

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestInit = await interceptor(url, requestInit);
    }

    try {
      const response = await fetch(url, requestInit);
      return this.handleResponse<T>(response, url);
    } catch (err) {
      return this.handleNetworkError(err, url);
    }
  }

  private async requestForm<T>(
    method: string,
    path: string,
    form: FormData,
    init: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`;
    const token = localStorage.getItem(TOKEN_KEY);

    let requestInit: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> || {}),
      },
      body: form,
      ...init,
    };

    // Remove Content-Type — the browser MUST set the multipart boundary itself
    const headers = requestInit.headers as Record<string, string>;
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    for (const interceptor of this.requestInterceptors) {
      requestInit = await interceptor(url, requestInit);
    }

    try {
      const response = await fetch(url, requestInit);
      return this.handleResponse<T>(response, url);
    } catch (err) {
      return this.handleNetworkError(err, url);
    }
  }

  private async handleResponse<T>(response: Response, url: string): Promise<ApiResponse<T>> {
    let body: T | undefined;

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (response.status !== 204) {
      const raw = isJson ? await response.json() : await response.text();
      // Unwrap backend ResponseInterceptor envelope: { success, data, timestamp }
      if (
        raw &&
        typeof raw === 'object' &&
        'success' in raw &&
        'data' in raw &&
        'timestamp' in raw
      ) {
        body = (raw as { success: boolean; data: T; timestamp: string }).data;
      } else {
        body = raw as T;
      }
    }

    if (!response.ok) {
      const errorBody = body as Record<string, unknown> | undefined;
      const message =
        (errorBody?.['message'] as string) ||
        (errorBody?.['error'] as string) ||
        response.statusText ||
        'An unexpected error occurred';
      const code = (errorBody?.['code'] as string) || `http_${response.status}`;
      const details = (errorBody?.['details'] as Record<string, unknown>) || undefined;

      const error = new ApiError(message, response.status, code, details);

      for (const interceptor of this.errorInterceptors) {
        await interceptor(error, url);
      }

      throw error;
    }

    const result: ApiResponse<T> = {
      data: body as T,
      status: response.status,
      headers: response.headers,
      ok: true,
    };

    for (const interceptor of this.responseInterceptors) {
      await interceptor(result, url);
    }

    return result;
  }

  private handleNetworkError<T>(err: unknown, url: string): Promise<ApiResponse<T>> {
    const message = err instanceof Error ? err.message : 'Network error';
    const error = new ApiError(message, 0, 'network_error');

    for (const interceptor of this.errorInterceptors) {
      // Fire-and-forget; we will throw regardless
      void interceptor(error, url);
    }

    throw error;
  }
}

// ───────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Shared API client instance used by all domain modules.
 *
 * Example:
 * ```ts
 * import { api } from '@/api/client';
 * const { data } = await api.get<UserProfile>('/users/me');
 * ```
 */
export const api = new ApiClient(API_BASE_URL);

/**
 * Convenience hook — clears stored tokens and reloads the page.
 * Called automatically by the global 401 interceptor.
 */
function clearAuthAndReload(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.location.href = '/';
}

// ───────────────────────────────────────────────────────────
// GLOBAL INTERCEPTORS
// ───────────────────────────────────────────────────────────

/** Log every request in development */
api.onRequest((url, init) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[API] ${init.method ?? 'GET'} ${url}`);
  }
  return init;
});

/** Log every response in development */
api.onResponse((res, url) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[API] ${res.status} ${url}`);
  }
  return res;
});

/** Auto-clear auth on 401 so the user lands back at the welcome screen */
api.onError((error) => {
  if (error.isUnauthorized) {
    clearAuthAndReload();
  }
});
