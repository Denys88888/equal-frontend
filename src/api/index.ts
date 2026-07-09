/**
 * Equal Dating App — API Layer Barrel Export
 *
 * Import everything from here:
 * ```ts
 * import { api, authApi, usersApi, useAuth } from '@/api';
 * ```
 */

// Core types
export * from './types';

// Base client (for custom requests, health checks, etc.)
export { api, ApiError, TOKEN_KEY, REFRESH_TOKEN_KEY } from './client';
export type { ApiResponse } from './client';

// Domain API namespaces
export { authApi } from './auth';
export { usersApi } from './users';
export { discoverApi } from './discover';
export { matchesApi } from './matches';
export { messagesApi } from './messages';
export { clubsApi } from './clubs';
export { eventsApi } from './events';
export { paymentsApi } from './payments';
export { adminApi } from './admin';
export { sparksApi } from './sparks';
