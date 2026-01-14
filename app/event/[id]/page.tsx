'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent, Participant, TimeSlot } from '@/lib/types';
import { getEvent, saveEvent } from '@/lib/storage';

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadedEvent = getEvent(eventId);
    setEvent(loadedEvent);
    setLoading(false);
  }, [eventId]);

  const toggleSlot = (date: string, time: string) => {
    const exists = selectedSlots.find(s => s.date === date && s.time === time);
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => !(s.date === date && s.time === time)));
    } else {
      setSelectedSlots([...selectedSlots, { date, time }]);
    }
  };

  const isSlotSelected = (date: string, time: string) => {
    return selectedSlots.some(s => s.date === date && s.time === time);
  };

  const getSlotCount = (date: string, time: string) => {
    if (!event) return 0;
    return event.participants.filter(p => 
      p.availableSlots.some(s => s.date === date && s.time === time)
    ).length;
  };

  const getParticipantsForSlot = (date: string, time: string) => {
    if (!event) return [];
    return event.participants.filter(p => 
      p.availableSlots.some(s => s.date === date && s.time === time)
    ).map(p => p.name);
  };

  const submitAvailability = () => {
    if (!participantName.trim()) {
      alert('Bitte gib deinen Namen ein.');
      return;
    }
    if (selectedSlots.length === 0) {
      alert('Bitte wähle mindestens einen Zeitslot aus.');
      return;
    }
    if (!event) return;

    const participant: Participant = {
      id: uuidv4(),
      name: participantName.trim(),
      availableSlots: selectedSlots,
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
    setSelectedSlots([]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]}`;
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
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Termin nicht gefunden</h1>
        <p className="text-gray-600 mb-6">Dieser Kalender existiert nicht oder wurde gelöscht.</p>
        <a href="/" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90">
          Neuen Kalender erstellen
        </a>
      </div>
    );
  }

  const maxParticipants = Math.max(1, ...event.dates.flatMap(date => 
    event.timeSlots.map(time => getSlotCount(date, time))
  ));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
            {event.description && (
              <p className="text-gray-600 mb-3">{event.description}</p>
            )}
            <p className="text-sm text-gray-500">
              Erstellt von <span className="font-medium">{event.creatorName}</span>
            </p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? '✅ Kopiert!' : '🔗 Link kopieren'}
          </button>
        </div>
        
        {event.participants.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-primary">{event.participants.length}</span> Teilnehmer haben bereits geantwortet:
              <span className="ml-2 text-gray-700">
                {event.participants.map(p => p.name).join(', ')}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Erfolgs-Nachricht */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-semibold text-green-800">Verfügbarkeit eingetragen!</h3>
              <p className="text-green-700 text-sm">Deine Zeiten wurden gespeichert. Du kannst weitere Einträge hinzufügen.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kalender-Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Verfügbarkeit anzeigen</h2>
          
          <div className="min-w-[500px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${event.dates.length}, 1fr)` }}>
              {/* Header Zeile */}
              <div></div>
              {event.dates.map(date => (
                <div key={date} className="text-center font-medium text-sm text-gray-700 py-2">
                  {formatDateDisplay(date)}
                </div>
              ))}
              
              {/* Zeit-Zeilen */}
              {event.timeSlots.map(time => (
                <div key={`row-${time}`} className="contents">
                  <div className="text-right pr-3 text-sm text-gray-600 py-2">
                    {time}
                  </div>
                  {event.dates.map(date => {
                    const count = getSlotCount(date, time);
                    const participants = getParticipantsForSlot(date, time);
                    const isSelected = isSlotSelected(date, time);
                    const intensity = count / maxParticipants;
                    
                    return (
                      <button
                        key={`${date}-${time}`}
                        onClick={() => toggleSlot(date, time)}
                        title={participants.length > 0 ? participants.join(', ') : 'Keine Teilnehmer'}
                        className={`
                          relative p-2 rounded-lg text-sm font-medium transition-all border-2
                          ${isSelected 
                            ? 'border-primary bg-primary text-white' 
                            : 'border-transparent hover:border-gray-300'}
                          ${!isSelected && count === 0 ? 'bg-gray-50' : ''}
                        `}
                        style={!isSelected && count > 0 ? {
                          backgroundColor: `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`
                        } : {}}
                      >
                        {count > 0 && (
                          <span className={isSelected ? 'text-white' : 'text-green-800'}>
                            {count}
                          </span>
                        )}
                        {isSelected && count === 0 && '✓'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border"></div>
              <span>Keine Antworten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}></div>
              <span>Teilnehmer verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span>Deine Auswahl</span>
            </div>
          </div>
        </div>

        {/* Eingabe-Formular */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Deine Verfügbarkeit</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dein Name
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Name eingeben..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">{selectedSlots.length}</span> Zeitslots ausgewählt
              </p>
              {selectedSlots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedSlots.slice(0, 6).map(slot => (
                    <span key={`${slot.date}-${slot.time}`} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {formatDateDisplay(slot.date)} {slot.time}
                    </span>
                  ))}
                  {selectedSlots.length > 6 && (
                    <span className="text-xs text-gray-500">+{selectedSlots.length - 6} weitere</span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={submitAvailability}
              disabled={!participantName.trim() || selectedSlots.length === 0}
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verfügbarkeit eintragen ✓
            </button>

            <p className="text-xs text-gray-500 text-center">
              Klicke auf die Zeitslots im Kalender, um deine Verfügbarkeit auszuwählen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
