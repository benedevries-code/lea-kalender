'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from '@/lib/types';
import { saveEvent } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];
  const [selectedTimes, setSelectedTimes] = useState<string[]>(timeSlots.slice(0, 8));

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

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
    }
  };

  const createEvent = () => {
    if (!title.trim() || !creatorName.trim() || selectedDates.length === 0) {
      alert('Bitte fülle alle Pflichtfelder aus und wähle mindestens ein Datum.');
      return;
    }

    const event: CalendarEvent = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      creatorName: creatorName.trim(),
      dates: selectedDates,
      timeSlots: selectedTimes,
      participants: [],
      createdAt: new Date().toISOString(),
    };

    saveEvent(event);
    router.push(`/event/${event.id}`);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Neuen Termin erstellen</h1>
        <p className="text-gray-600 mb-8">Erstelle einen Kalender und teile den Link, damit andere ihre Verfügbarkeit eintragen können.</p>

        <div className="space-y-6">
          {/* Titel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel des Termins *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Team-Meeting, Geburtstagsfeier..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weitere Details zum Termin..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Ersteller Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dein Name *
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Dein Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Kalender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mögliche Termine auswählen *
            </label>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg text-xl"
                >
                  ←
                </button>
                <span className="font-semibold text-lg">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg text-xl"
                >
                  →
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
                      className={`
                        py-2 rounded-lg text-sm transition-all
                        ${!date ? 'invisible' : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${isSelected 
                          ? 'bg-primary text-white font-semibold' 
                          : date && !isPast ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {selectedDates.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                ✅ {selectedDates.length} Datum/Daten ausgewählt
              </p>
            )}
          </div>

          {/* Zeitslots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uhrzeiten zur Auswahl
            </label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedTimes.includes(time)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Erstellen Button */}
          <button
            onClick={createEvent}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
          >
            Kalender erstellen & Link teilen 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
