'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent, Participant, TimeSlot, BRUNO_OPTIONS, FAMILY_MEMBERS } from '@/lib/types';
import { getEvent, saveEvent } from '@/lib/storage';

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<{[date: string]: string}>({});
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadedEvent = getEvent(eventId);
    setEvent(loadedEvent);
    setLoading(false);
  }, [eventId]);

  const selectOption = (date: string, option: string) => {
    setSelectedSlots(prev => {
      if (prev[date] === option) {
        const newSlots = {...prev};
        delete newSlots[date];
        return newSlots;
      }
      return {...prev, [date]: option};
    });
  };

  const getSelectionsForDate = (date: string) => {
    if (!event) return [];
    return event.participants.flatMap(p => 
      p.availableSlots
        .filter(s => s.date === date)
        .map(s => ({name: p.name, option: s.option}))
    );
  };

  const submitAvailability = () => {
    if (!participantName) {
      alert('Bitte waehle deinen Namen.');
      return;
    }
    if (Object.keys(selectedSlots).length === 0) {
      alert('Bitte waehle mindestens eine Option fuer einen Tag.');
      return;
    }
    if (!event) return;

    const slots: TimeSlot[] = Object.entries(selectedSlots).map(([date, option]) => ({
      date,
      option
    }));

    const participant: Participant = {
      id: uuidv4(),
      name: participantName,
      availableSlots: slots,
      createdAt: new Date().toISOString(),
    };

    const updatedEvent = {
      ...event,
      participants: [...event.participants, participant],
    };

    saveEvent(updatedEvent);
    setEvent(updatedEvent);
    setSubmitted(true);
    setParticipantName('');
    setSelectedSlots({});
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const months = ['Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return days[date.getDay()] + ', ' + date.getDate() + '. ' + months[date.getMonth()];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">:(</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Kalender nicht gefunden</h1>
        <p className="text-gray-600 mb-6">Dieser Kalender existiert nicht.</p>
        <a href="/" className="inline-block px-6 py-3 bg-primary text-white rounded-lg">
          Neuen Kalender erstellen
        </a>
      </div>
    );
  }

  const options = event.options || BRUNO_OPTIONS;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
            <p className="text-gray-600 mb-3">{event.description}</p>
            <p className="text-sm text-gray-500">Erstellt von <span className="font-medium">{event.creatorName}</span></p>
          </div>
          <button onClick={copyLink} className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            {copied ? 'Kopiert!' : 'Link kopieren'}
          </button>
        </div>
        {event.participants.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-primary">{event.participants.length}</span> Person(en) haben eingetragen: {event.participants.map(p => p.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">:)</span>
            <div>
              <h3 className="font-semibold text-green-800">Eingetragen!</h3>
              <p className="text-green-700 text-sm">Deine Auswahl wurde gespeichert.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Deine Verfuegbarkeit eintragen</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dein Name</label>
          <select
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">-- Bitte waehlen --</option>
            {FAMILY_MEMBERS.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <p className="text-gray-600 mb-4">Waehle fuer jeden Tag, wie du Bruno nehmen kannst:</p>

        <div className="space-y-6">
          {event.dates.map(date => {
            const selections = getSelectionsForDate(date);
            return (
              <div key={date} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">{formatDateDisplay(date)}</h3>
                
                {selections.length > 0 && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Bereits eingetragen:</p>
                    {selections.map((s, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{s.name}:</span> {s.option}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-2">
                  {options.map(option => (
                    <button
                      key={option}
                      onClick={() => selectOption(date, option)}
                      className={
                        "w-full text-left px-4 py-3 rounded-lg border-2 transition-all " +
                        (selectedSlots[date] === option
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700')
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">
              {Object.keys(selectedSlots).length} von {event.dates.length} Tagen ausgewaehlt
            </span>
          </div>
          <button
            onClick={submitAvailability}
            disabled={!participantName || Object.keys(selectedSlots).length === 0}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eintragen
          </button>
        </div>
      </div>
    </div>
  );
}
