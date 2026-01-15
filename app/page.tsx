'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Participant, TimeSlot, BRUNO_OPTIONS, LEA_HELP_OPTIONS, FAMILY_MEMBERS } from '@/lib/types';

interface StoredData {
  dates: string[];
  participants: Participant[];
  leaRequests: {date: string; helpType: string}[];
}

export default function Home() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<{[date: string]: string}>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaRequests, setLeaRequests] = useState<{date: string; helpType: string}[]>([]);
  const [leaSelectedSlots, setLeaSelectedSlots] = useState<{[date: string]: string}>({});
  const [leaSubmitted, setLeaSubmitted] = useState(false);

  // Laden der gespeicherten Daten von der API
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: StoredData) => {
        setSelectedDates(data.dates || []);
        setParticipants(data.participants || []);
        setLeaRequests(data.leaRequests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Speichern bei Änderungen an die API
  const saveData = async (dates: string[], parts: Participant[], leaReqs: {date: string; helpType: string}[]) => {
    const data: StoredData = { dates, participants: parts, leaRequests: leaReqs };
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const months = ['Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return days[date.getDay()] + ', ' + date.getDate() + '. ' + months[date.getMonth()];
  };

  const toggleDate = (date: Date | null) => {
    if (!date) return;
    const dateStr = formatDate(date);
    let newDates: string[];
    if (selectedDates.includes(dateStr)) {
      newDates = selectedDates.filter(d => d !== dateStr);
    } else {
      newDates = [...selectedDates, dateStr].sort();
    }
    setSelectedDates(newDates);
    saveData(newDates, participants, leaRequests);
  };

  const selectOption = (date: string, option: string) => {
    if (option === '') {
      setSelectedSlots(prev => {
        const newSlots = {...prev};
        delete newSlots[date];
        return newSlots;
      });
    } else {
      setSelectedSlots(prev => ({...prev, [date]: option}));
    }
  };

  const selectLeaOption = (date: string, option: string) => {
    if (option === '') {
      setLeaSelectedSlots(prev => {
        const newSlots = {...prev};
        delete newSlots[date];
        return newSlots;
      });
    } else {
      setLeaSelectedSlots(prev => ({...prev, [date]: option}));
    }
  };

  const getSelectionsForDate = (date: string) => {
    return participants.flatMap(p =>
      p.availableSlots
        .filter(s => s.date === date)
        .map(s => ({name: p.name, option: s.option}))
    );
  };

  const getLeaRequestForDate = (date: string) => {
    return leaRequests.find(r => r.date === date);
  };

  // Prüfen ob ein Tag bereits einen Eintrag hat
  const hasEntryForDate = (dateStr: string) => {
    return participants.some(p =>
      p.availableSlots.some(s => s.date === dateStr)
    );
  };

  // Prüfen ob Lea für diesen Tag Hilfe braucht
  const leaNeedsHelpForDate = (dateStr: string) => {
    return leaRequests.some(r => r.date === dateStr);
  };

  const submitAvailability = async () => {
    if (!participantName) {
      alert('Bitte waehle deinen Namen.');
      return;
    }
    if (Object.keys(selectedSlots).length === 0) {
      alert('Bitte waehle mindestens eine Option fuer einen Tag.');
      return;
    }

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

    const newParticipants = [...participants, participant];
    setParticipants(newParticipants);
    await saveData(selectedDates, newParticipants, leaRequests);
    setSubmitted(true);
    setParticipantName('');
    setSelectedSlots({});

    setTimeout(() => setSubmitted(false), 3000);
  };

  const submitLeaRequest = async () => {
    if (Object.keys(leaSelectedSlots).length === 0) {
      alert('Bitte waehle mindestens eine Option fuer einen Tag.');
      return;
    }

    const newRequests = Object.entries(leaSelectedSlots).map(([date, helpType]) => ({
      date,
      helpType
    }));

    // Alte Requests für diese Tage entfernen und neue hinzufügen
    const updatedRequests = [
      ...leaRequests.filter(r => !newRequests.some(nr => nr.date === r.date)),
      ...newRequests
    ];

    setLeaRequests(updatedRequests);
    await saveData(selectedDates, participants, updatedRequests);
    setLeaSubmitted(true);
    setLeaSelectedSlots({});

    setTimeout(() => setLeaSubmitted(false), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link kopiert!');
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Link teilen */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bruno Betreuungskalender</h1>
            <p className="text-gray-600 text-sm">Teile diesen Link mit der Familie</p>
          </div>
          <button
            onClick={copyLink}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Link kopieren
          </button>
        </div>
        {participants.length > 0 && (
          <p className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-primary">{participants.length}</span> Person(en) haben eingetragen: {participants.map(p => p.name).join(', ')}
          </p>
        )}
      </div>

      {/* Bruno Kita Info */}
      <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🐕</span>
          <div>
            <h2 className="text-xl font-bold text-amber-800">Bruno ist in der Kita</h2>
            <p className="text-amber-700 text-lg font-medium">Montag - Freitag: 8:00 - 13:00 Uhr</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-300 space-y-2">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>Nur <strong>Katja</strong> und <strong>Maren</strong> duerfen Bruno direkt aus der Kita abholen!</span>
          </p>
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span>🚗</span>
            <span>Bitte an den <strong>Kindersitz</strong> denken!</span>
          </p>
        </div>
      </div>

      {/* LEA BEREICH */}
      <div className="bg-pink-100 border-2 border-pink-400 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">👩</span>
          <div>
            <h2 className="text-xl font-bold text-pink-800">Lea - Hilfe anfragen</h2>
            <p className="text-pink-700">Trage hier ein, wann du Unterstuetzung brauchst</p>
          </div>
        </div>

        {leaSubmitted && (
          <div className="bg-pink-200 border border-pink-400 rounded-lg p-4 mb-4">
            <p className="text-pink-800 font-semibold">Gespeichert! Deine Anfrage wurde eingetragen.</p>
          </div>
        )}

        {selectedDates.length > 0 ? (
          <div className="space-y-3">
            {selectedDates.map(date => {
              const existingRequest = getLeaRequestForDate(date);
              return (
                <div key={date} className="bg-white rounded-lg p-4 border border-pink-200">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="md:w-1/4">
                      <h3 className="font-semibold text-pink-800">{formatDateDisplay(date)}</h3>
                      {existingRequest && (
                        <p className="text-sm text-pink-600">Aktuell: {existingRequest.helpType}</p>
                      )}
                    </div>
                    <div className="md:w-3/4">
                      <select
                        value={leaSelectedSlots[date] || ''}
                        onChange={(e) => selectLeaOption(date, e.target.value)}
                        className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                      >
                        <option value="">-- Was brauchst du? --</option>
                        {LEA_HELP_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={submitLeaRequest}
              disabled={Object.keys(leaSelectedSlots).length === 0}
              className="w-full py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hilfe-Anfrage speichern
            </button>
          </div>
        ) : (
          <p className="text-pink-700">Waehle zuerst Tage im Kalender aus.</p>
        )}
      </div>

      {/* Name auswählen */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Dein Name</h2>
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

      {/* Kalender für Datumsauswahl - GRÖSSER */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tage auswaehlen</h2>
        <p className="text-gray-600 text-sm mb-4">Klicke auf Tage, fuer die Bruno Betreuung braucht:</p>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary"></div>
            <span>Betreuung gesucht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500"></div>
            <span>Jemand kuemmert sich</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-pink-500"></div>
            <span>Lea braucht Hilfe</span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-3 hover:bg-gray-100 rounded-lg text-2xl font-bold"
            >
              ←
            </button>
            <span className="font-bold text-2xl">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-3 hover:bg-gray-100 rounded-lg text-2xl font-bold"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
              <div key={day} className="text-center text-base font-bold text-gray-600 py-3">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((date, i) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = date ? date < today : false;
              const dateStr = date ? formatDate(date) : '';
              const isSelected = date ? selectedDates.includes(dateStr) : false;
              const hasEntry = date ? hasEntryForDate(dateStr) : false;
              const leaNeedsHelp = date ? leaNeedsHelpForDate(dateStr) : false;

              return (
                <button
                  key={i}
                  onClick={() => toggleDate(date)}
                  disabled={!date || isPast}
                  className={"py-4 rounded-xl text-lg font-semibold transition-all " +
                    (!date ? 'invisible ' : '') +
                    (isPast ? 'text-gray-300 cursor-not-allowed ' : '') +
                    (hasEntry
                      ? 'bg-green-500 text-white ring-2 ring-green-600 '
                      : leaNeedsHelp
                        ? 'bg-pink-500 text-white ring-2 ring-pink-600 '
                        : isSelected
                          ? 'bg-primary text-white '
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
          <p className="mt-4 text-base text-gray-600">
            {selectedDates.length} Tag(e) ausgewaehlt
          </p>
        )}
      </div>

      {/* Verfügbarkeit eintragen */}
      {selectedDates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Deine Verfuegbarkeit eintragen</h2>

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold">Eingetragen! Deine Auswahl wurde gespeichert.</p>
            </div>
          )}

          <p className="text-gray-600 mb-4">Waehle fuer jeden Tag, wie du Bruno nehmen kannst:</p>

          <div className="space-y-4">
            {selectedDates.map(date => {
              const selections = getSelectionsForDate(date);
              const hasEntry = selections.length > 0;
              const leaRequest = getLeaRequestForDate(date);
              return (
                <div key={date} className={"border rounded-lg p-4 " + (hasEntry ? 'border-green-500 bg-green-50' : leaRequest ? 'border-pink-400 bg-pink-50' : 'border-gray-200')}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="md:w-1/4">
                      <h3 className={"font-semibold text-lg " + (hasEntry ? 'text-green-800' : leaRequest ? 'text-pink-800' : 'text-gray-800')}>
                        {formatDateDisplay(date)}
                        {hasEntry && <span className="ml-2">✓</span>}
                      </h3>
                      {leaRequest && (
                        <p className="text-sm text-pink-600 font-medium mt-1">
                          🙋 Lea: {leaRequest.helpType}
                        </p>
                      )}
                      {selections.length > 0 && (
                        <div className="mt-1">
                          {selections.map((s, i) => (
                            <p key={i} className="text-sm text-green-700 font-medium">
                              {s.name}: {s.option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="md:w-3/4">
                      <select
                        value={selectedSlots[date] || ''}
                        onChange={(e) => selectOption(date, e.target.value)}
                        className={
                          "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent " +
                          (selectedSlots[date] ? 'border-primary bg-primary/5' : 'border-gray-300')
                        }
                      >
                        <option value="">-- Option waehlen --</option>
                        {BRUNO_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">
                {Object.keys(selectedSlots).length} von {selectedDates.length} Tagen ausgewaehlt
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
      )}
    </div>
  );
}
