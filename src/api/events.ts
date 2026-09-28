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

/** "How was the event?" — accepted only from attendees, after the event. */
export async function submitEventFeedback(eventId: string, rating: 'great' | 'okay' | 'missed'): Promise<void> {
  await api.post(`/events/${encodeURIComponent(eventId)}/feedback`, { rating });
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

/** What a user sends to propose an event. Price is deliberately absent — only an admin sets it. */
export interface CreateEventRequest {
  title: string;
  description?: string;
  /** ISO 8601, must be in the future. */
  date: string;
  location: string;
  city: string;
  category: 'Speed Dating' | 'Social Mixers' | 'Outdoor' | 'Workshops' | 'Parties';
  maxAttendees?: number;
}

/**
 * Propose an event. It is created PENDING and stays visible only to its author
 * until an admin approves it.
 *
 * @throws {ApiError} 400 if the date is past or the user already has 3 events awaiting review
 */
export async function createEvent(payload: CreateEventRequest): Promise<{ id: string; status: string }> {
  const { data } = await api.post<{ id: string; status: string }>('/events', payload);
  return data;
}
