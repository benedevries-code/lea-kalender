export interface TimeSlot {
  date: string;
  option: string;
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
  options: string[];
  participants: Participant[];
  createdAt: string;
}

export const BRUNO_OPTIONS = [
  ' Bruno Kita abholen',
  ' Bruno zuhause abholen',
  ' Bruno Kita abholen mit Übernachtung',
  ' Bruno zuhause abholen mit Übernachtung',
  ' Bruno Kita abholen und abends nach Hause bringen',
  ' Bruno Kita abholen und abends abholen lassen',
  ' Bruno Kita abholen mit mehreren Übernachtungen',
  ' Bruno zuhause abholen mit mehreren Übernachtungen',
];
