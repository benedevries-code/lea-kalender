'use client';

import { useState, useEffect } from 'react';
import { LEA_HELP_OPTIONS, FAMILY_MEMBERS } from '@/lib/types';

interface StoredData {
  dates: string[];
  leaRequests: {date: string; helpType: string; helper?: string}[];
}

export default function Home() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [leaRequests, setLeaRequests] = useState<{date: string; helpType: string; helper?: string}[]>([]);
  const [leaSelectedSlots, setLeaSelectedSlots] = useState<{[date: string]: string}>({});
  const [leaCustomMessages, setLeaCustomMessages] = useState<{[date: string]: string}>({});
  const [leaSubmitted, setLeaSubmitted] = useState(false);

  // Laden der gespeicherten Daten von der API
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: StoredData) => {
        setSelectedDates(data.dates || []);
        setLeaRequests(data.leaRequests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Speichern bei Änderungen an die API
  const saveData = async (dates: string[], leaReqs: {date: string; helpType: string; helper?: string}[]) => {
    const data: StoredData = { dates, leaRequests: leaReqs };
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
    saveData(newDates, leaRequests);
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

  const getLeaRequestForDate = (date: string) => {
    return leaRequests.find(r => r.date === date);
  };

  // Prüfen ob Lea für diesen Tag Hilfe braucht
  const leaNeedsHelpForDate = (dateStr: string) => {
    return leaRequests.some(r => r.date === dateStr);
  };

  // Prüfen ob jemand für diesen Tag hilft
  const hasHelperForDate = (dateStr: string) => {
    return leaRequests.some(r => r.date === dateStr && r.helper);
  };

  const submitLeaRequest = async () => {
    if (Object.keys(leaSelectedSlots).length === 0) {
      alert('Bitte waehle mindestens eine Option fuer einen Tag.');
      return;
    }

    const newRequests = Object.entries(leaSelectedSlots).map(([date, helpType]) => ({
      date,
      helpType: helpType === 'custom' ? (leaCustomMessages[date] || 'Eigene Nachricht') : helpType
    })).filter(r => r.helpType);

    // Alte Requests für diese Tage entfernen und neue hinzufügen
    const updatedRequests = [
      ...leaRequests.filter(r => !newRequests.some(nr => nr.date === r.date)),
      ...newRequests
    ];

    setLeaRequests(updatedRequests);
    await saveData(selectedDates, updatedRequests);
    setLeaSubmitted(true);
    setLeaSelectedSlots({});
    setLeaCustomMessages({});

    setTimeout(() => setLeaSubmitted(false), 3000);
  };

  // Helfer eintragen
  const toggleHelper = async (date: string, helperName: string) => {
    const request = leaRequests.find(r => r.date === date);
    if (!request) return;

    const updatedRequests = leaRequests.map(r => {
      if (r.date === date) {
        // Wenn schon eingetragen, dann entfernen
        if (r.helper === helperName) {
          return { ...r, helper: undefined };
        }
        // Sonst eintragen
        return { ...r, helper: helperName };
      }
      return r;
    });

    setLeaRequests(updatedRequests);
    await saveData(selectedDates, updatedRequests);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link kopiert!');
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  // Sortierte Hilfe-Anfragen (nur zukünftige)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedRequests = leaRequests
    .filter(r => {
      const parts = r.date.split('-');
      const reqDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return reqDate >= today;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

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
      </div>

      {/* Bruno Kita Info */}
      <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl"></span>
          <div>
            <h2 className="text-xl font-bold text-amber-800">Bruno ist in der Kita</h2>
            <p className="text-amber-700 text-lg font-medium">Montag - Freitag: 8:00 - 13:00 Uhr</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-300 space-y-2">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span></span>
            <span>Nur <strong>Katja</strong>, <strong>Maren</strong> und <strong>Mareike</strong> duerfen Bruno direkt aus der Kita abholen!</span>
          </p>
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span></span>
            <span>Bitte an den <strong>Kindersitz</strong> denken!</span>
          </p>
        </div>
      </div>

      {/* LISTE: Wann braucht Lea Hilfe? */}
      {sortedRequests.length > 0 && (
        <div className="bg-green-100 border-2 border-green-400 rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl"></span>
            <div>
              <h2 className="text-xl font-bold text-green-800">Lea braucht Hilfe - Wer kann?</h2>
              <p className="text-green-700">Klicke auf deinen Namen um zu helfen</p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedRequests.map(request => (
              <div key={request.date} className={"rounded-lg p-4 border-2 " + (request.helper ? 'bg-green-200 border-green-500' : 'bg-white border-green-300')}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-green-800">{formatDateDisplay(request.date)}</h3>
                    <p className="text-green-700"> {request.helpType}</p>
                    {request.helper && (
                      <p className="text-green-800 font-bold mt-1"> {request.helper} hilft!</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FAMILY_MEMBERS.map(name => (
                      <button
                        key={name}
                        onClick={() => toggleHelper(request.date, name)}
                        className={"px-4 py-2 rounded-lg font-medium transition-all " +
                          (request.helper === name
                            ? 'bg-green-600 text-white'
                            : request.helper
                              ? 'bg-gray-200 text-gray-500'
                              : 'bg-white border-2 border-green-400 text-green-700 hover:bg-green-50'
                          )
                        }
                      >
                        {request.helper === name ? ' ' + name : name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEA BEREICH */}
      <div className="bg-pink-100 border-2 border-pink-400 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl"></span>
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
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="font-semibold text-pink-800">{formatDateDisplay(date)}</h3>
                      {existingRequest && (
                        <p className="text-sm text-pink-600">Aktuell: {existingRequest.helpType}</p>
                      )}
                    </div>
                    <div>
                      <select
                        value={leaSelectedSlots[date] || ''}
                        onChange={(e) => selectLeaOption(date, e.target.value)}
                        className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                      >
                        <option value="">-- Was brauchst du? --</option>
                        {LEA_HELP_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                        <option value="custom">Eigene Nachricht schreiben...</option>
                      </select>
                    </div>
                    {leaSelectedSlots[date] === 'custom' && (
                      <div>
                        <input
                          type="text"
                          placeholder="Schreibe hier deine Nachricht..."
                          value={leaCustomMessages[date] || ''}
                          onChange={(e) => setLeaCustomMessages(prev => ({...prev, [date]: e.target.value}))}
                          className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                      </div>
                    )}
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

      {/* Kalender für Datumsauswahl */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tage auswaehlen</h2>
        <p className="text-gray-600 text-sm mb-4">Klicke auf Tage, fuer die Bruno Betreuung braucht:</p>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary"></div>
            <span>Ausgewaehlt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500"></div>
            <span>Jemand hilft</span>
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
              
            </button>
            <span className="font-bold text-2xl">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-3 hover:bg-gray-100 rounded-lg text-2xl font-bold"
            >
              
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
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              const isPast = date ? date < todayDate : false;
              const dateStr = date ? formatDate(date) : '';
              const isSelected = date ? selectedDates.includes(dateStr) : false;
              const hasHelper = date ? hasHelperForDate(dateStr) : false;
              const leaNeedsHelp = date ? leaNeedsHelpForDate(dateStr) : false;

              return (
                <button
                  key={i}
                  onClick={() => toggleDate(date)}
                  disabled={!date || isPast}
                  className={"py-4 rounded-xl text-lg font-semibold transition-all " +
                    (!date ? 'invisible ' : '') +
                    (isPast ? 'text-gray-300 cursor-not-allowed ' : '') +
                    (hasHelper
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
    </div>
  );
}
 
 