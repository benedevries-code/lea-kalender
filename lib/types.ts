export interface TimeSlot {
  date: string;
  time: string;
}

export interface Participant {
  id: string;
  name: string;
  availableSlots: TimeSlot[];
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  dates: string[];
  timeSlots: string[];
  participants: Participant[];
  createdAt: string;
}
