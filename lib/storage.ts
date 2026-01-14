import { CalendarEvent } from './types';

const STORAGE_KEY = 'lea-calendar-events';

export function getEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getEvent(id: string): CalendarEvent | null {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

export function saveEvent(event: CalendarEvent): void {
  const events = getEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
