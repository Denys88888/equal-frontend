/**
 * Equal Dating App — Users API
 *
 * Profile management, photo uploads / reorder / delete,
 * and selfie-based verification submission.
 */

import { api } from './client';
import type {
  UserProfile,
  Photo,
  VerificationSelfieResponse,
  VerificationGesture,
} from './types';

/**
 * Fetch the current user's full profile.
 * @returns The authenticated user's profile with photos, interests, trust score, etc.
 * @throws {ApiError} 401 if not authenticated
 */
export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile & { profile?: Partial<UserProfile> }>('/users/me');
  // Normalize: some backend versions nest profile fields under .profile
  const nested = (data as unknown as { profile?: Partial<UserProfile> }).profile;
  if (nested && typeof nested === 'object') {
    return {
      ...data,
      bio: data.bio ?? nested.bio ?? '',
      birthDate: data.birthDate ?? nested.birthDate ?? '',
      city: data.city ?? nested.city ?? '',
      goals: data.goals ?? nested.goals ?? [],
      interests: data.interests ?? nested.interests ?? [],
      photos: data.photos ?? nested.photos ?? [],
      trustScore: data.trustScore ?? nested.trustScore ?? 50,
    } as UserProfile;
  }
  return data;
}

/**
 * Update the current user's profile fields.
 *
 * Only the fields you provide are updated; omitted fields remain untouched.
 *
 * @param patch — partial UserProfile (name, bio, birthDate, city, goals, interests, …)
 * @returns The updated full profile
 * @throws {ApiError} 400 on validation failure; 401 if not authenticated
 */
export async function updateMe(patch: Partial<UserProfile>): Promise<UserProfile> {
  // Split into user-level vs profile-level fields to support both backend versions:
  // - deployed main branch: /users/me only takes name/avatar; /profiles/me takes bio/city/etc.
  // - local master branch: /users/me accepts all fields
  const { name, avatar, bio, birthDate, city, interests, goals } = patch as Record<string, unknown>;

  const userPatch: Record<string, unknown> = {};
  if (name !== undefined) userPatch.name = name;
  if (avatar !== undefined) userPatch.avatar = avatar;

  const profilePatch: Record<string, unknown> = {};
  if (bio !== undefined) profilePatch.bio = bio;
  if (birthDate !== undefined) profilePatch.birthDate = birthDate;
  if (city !== undefined) profilePatch.city = city;
  if (interests !== undefined) profilePatch.interests = interests;
  if (goals !== undefined) profilePatch.goals = goals;

  await Promise.all([
    Object.keys(userPatch).length > 0 ? api.patch('/users/me', userPatch) : Promise.resolve(),
    Object.keys(profilePatch).length > 0
      ? api.put('/profiles/me', profilePatch).catch(() => api.patch('/users/me', profilePatch))
      : Promise.resolve(),
  ]);

  return getMe();
}

/**
 * Upload a new profile photo.
 *
 * The backend handles image optimisation (resize, WebP conversion).
 *
 * @param file    — the image file to upload
 * @param isMain  — whether this photo becomes the primary / main photo
 * @returns The newly created Photo record with CDN URL
 * @throws {ApiError} 413 if file too large; 415 if unsupported format
 */
export async function uploadPhoto(file: File, isMain: boolean = false): Promise<Photo> {
  const form = new FormData();
  form.append('photo', file);
  form.append('isMain', String(isMain));

  const { data } = await api.postForm<Photo>('/users/me/photos', form);
  return data;
}

/**
 * Delete a profile photo by its ID.
 *
 * @param photoId — the photo's unique identifier
 * @throws {ApiError} 404 if photo not found or does not belong to user
 */
export async function deletePhoto(photoId: string): Promise<void> {
  await api.delete(`/users/me/photos?photoId=${encodeURIComponent(photoId)}`);
}

/**
 * Reorder the user's photos.
 *
 * The order of IDs in the array becomes the new display order (0 = first).
 *
 * @param photoIds — ordered array of photo identifiers
 * @throws {ApiError} 400 if any ID is invalid or missing
 */
export async function reorderPhotos(photoIds: string[]): Promise<void> {
  await api.post('/users/me/photos/reorder', { photoIds });
}

/**
 * Submit a selfie video for profile verification.
 *
 * The backend runs liveness checks and queues the video for human review.
 *
 * @param video   — recorded selfie video file (mp4 / webm)
 * @param gesture — the gesture the user was asked to perform
 * @returns Current verification status (pending, approved, rejected)
 * @throws {ApiError} 400 if video format invalid; 401 if not authenticated
 */
export async function submitVerificationSelfie(
  video: File,
  gesture: VerificationGesture,
): Promise<VerificationSelfieResponse> {
  const form = new FormData();
  form.append('video', video);
  form.append('gesture', gesture);

  const { data } = await api.postForm<VerificationSelfieResponse>('/verification/selfie', form);
  return data;
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped users API methods:
 * `import { usersApi } from '@/api/users'`
 */
export const usersApi = {
  getMe,
  updateMe,
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
  submitVerificationSelfie,
};
