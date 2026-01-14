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
  'Bruno Kita abholen',
  'Bruno zuhause abholen',
  'Bruno Kita abholen mit Uebernachtung',
  'Bruno zuhause abholen mit Uebernachtung',
  'Bruno Kita abholen und abends nach Hause bringen',
  'Bruno Kita abholen und abends abholen lassen',
  'Bruno Kita abholen mit mehreren Uebernachtungen',
  'Bruno zuhause abholen mit mehreren Uebernachtungen',
];

export const FAMILY_MEMBERS = [
  'Kathja',
  'Maren',
  'Noah & Mareike',
  'Volker',
  'Lukas & Mandy',
];
