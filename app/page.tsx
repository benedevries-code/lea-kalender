'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent, BRUNO_OPTIONS, FAMILY_MEMBERS } from '@/lib/types';
import { saveEvent } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < (firstDay.getDay() || 7) - 1; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDate = (date: Date | null) => {
    if (!date) return;
    const dateStr = formatDate(date);
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr].sort());
    }
  };

  const createEvent = () => {
    if (!creatorName || selectedDates.length === 0) {
      alert('Bitte waehle deinen Namen und mindestens ein Datum.');
      return;
    }

    const event: CalendarEvent = {
      id: uuidv4(),
      title: 'Bruno Betreuungskalender',
      description: 'Wer kann wann auf Bruno aufpassen?',
      creatorName: creatorName,
      dates: selectedDates,
      options: BRUNO_OPTIONS,
      participants: [],
      createdAt: new Date().toISOString(),
    };

    saveEvent(event);
    router.push('/event/' + event.id);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bruno Betreuungskalender</h1>
        <p className="text-gray-600 mb-8">Waehle die Tage aus, fuer die du Betreuung planst. Dann koennen alle eintragen, wann und wie sie Bruno nehmen koennen.</p>

        <div className="space-y-6">
          {/* Ersteller Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dein Name *
            </label>
            <select
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">-- Bitte waehlen --</option>
              {FAMILY_MEMBERS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Kalender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tage auswaehlen, fuer die Betreuung gebraucht wird *
            </label>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg text-xl"
                >
                  &lt;-
                </button>
                <span className="font-semibold text-lg">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg text-xl"
                >
                  -&gt;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date ? date < today : false;
                  const isSelected = date ? selectedDates.includes(formatDate(date)) : false;

                  return (
                    <button
                      key={i}
                      onClick={() => toggleDate(date)}
                      disabled={!date || isPast}
                      className={"py-2 rounded-lg text-sm transition-all " +
                        (!date ? 'invisible ' : '') +
                        (isPast ? 'text-gray-300 cursor-not-allowed ' : '') +
                        (isSelected
                          ? 'bg-primary text-white font-semibold '
                          : date && !isPast ? 'hover:bg-gray-100 ' : '')
                      }
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDates.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedDates.length} Tag(e) ausgewaehlt
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Verfuegbare Optionen</h3>
            <p className="text-blue-700 text-sm mb-2">Die Teilnehmer koennen fuer jeden Tag eine dieser Optionen waehlen:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              {BRUNO_OPTIONS.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
          </div>

          {/* Erstellen Button */}
          <button
            onClick={createEvent}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
          >
            Kalender erstellen und Link teilen
          </button>
        </div>
      </div>
    </div>
  );
}
