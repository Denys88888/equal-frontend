/**
 * Equal Dating App — Events API
 *
 * Offline / in-person events: listing, filtering, and RSVPing.
 */

import { api } from './client';
import type { Event, RsvpRequest } from './types';

/**
 * Fetch events with optional filters.
 *
 * @param city      — optional city filter (e.g. 'New York')
 * @param category  — optional event category (e.g. 'speed_dating', 'party')
 * @param fromDate  — optional ISO date string to filter events on or after
 * @returns Array of Event objects ordered by date (soonest first)
 * @throws {ApiError} 401 if not authenticated
 */
export async function getEvents(
  city?: string,
  category?: string,
  fromDate?: string,
): Promise<Event[]> {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  if (fromDate) params.set('fromDate', fromDate);

  const qs = params.toString();
  const { data } = await api.get<Event[]>(`/events${qs ? `?${qs}` : ''}`);
  return data;
}

/**
 * Fetch a single event by ID.
 *
 * @param eventId — the event's unique identifier
 * @returns Event detail including host info and attendee count
 * @throws {ApiError} 404 if event not found
 */
export async function getEvent(eventId: string): Promise<Event> {
  const { data } = await api.get<Event>(`/events/${encodeURIComponent(eventId)}`);
  return data;
}

/**
 * RSVP to an event.
 *
 * @param eventId — the event to respond to
 * @param status  — 'going', 'interested', or 'not_going'
 * @throws {ApiError} 404 if event not found; 409 if event is at capacity
 */
export async function rsvp(
  eventId: string,
  status: 'going' | 'interested' | 'not_going',
): Promise<void> {
  await api.post<void>(`/events/${encodeURIComponent(eventId)}/rsvp`, {
    status,
  } as RsvpRequest);
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped events API methods:
 * `import { eventsApi } from '@/api/events'`
 */
export const eventsApi = {
  getEvents,
  getEvent,
  rsvp,
};
