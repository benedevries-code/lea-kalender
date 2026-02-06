'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FAMILY_MEMBERS } from '@/lib/types';

interface BetreuungEntry {
  date: string;
  timeFrom: string;
  timeTo: string;
  message: string;
  abholort?: string;
  transport?: string;
  name: string;
}

interface LoginEntry {
  name: string;
  timestamp: string;
  type: 'login' | 'password_set';
}

interface StoredData {
  dates: string[];
  leaRequests: { date: string; timeFrom: string; timeTo: string; message: string; abholort?: string; transport?: string; helper?: string }[];
  betreuungEntries?: BetreuungEntry[];
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [leaRequests, setLeaRequests] = useState<{ date: string; timeFrom: string; timeTo: string; message: string; abholort?: string; transport?: string; helper?: string }[]>([]);
  const [leaDate, setLeaDate] = useState('');
  const [leaTimeFrom, setLeaTimeFrom] = useState('');
  const [leaTimeTo, setLeaTimeTo] = useState('');
  const [leaMessage, setLeaMessage] = useState('');
  const [leaAbholort, setLeaAbholort] = useState('');
  const [leaTransport, setLeaTransport] = useState('');
  const [leaSubmitted, setLeaSubmitted] = useState(false);
  // Betreuung durch Familie
  const [betreuungEntries, setBetreuungEntries] = useState<BetreuungEntry[]>([]);
  const [betreuungDate, setBetreuungDate] = useState('');
  const [betreuungTimeFrom, setBetreuungTimeFrom] = useState('');
  const [betreuungTimeTo, setBetreuungTimeTo] = useState('');
  const [betreuungMessage, setBetreuungMessage] = useState('');
  const [betreuungAbholort, setBetreuungAbholort] = useState('');
  const [betreuungTransport, setBetreuungTransport] = useState('');
  const [betreuungSubmitted, setBetreuungSubmitted] = useState(false);
  // Admin: Login-Historie
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user just came from select-user page (same session)
    const justSelected = window.sessionStorage.getItem('bruno_just_selected');
    const stored = window.sessionStorage.getItem('bruno_user');

    if (justSelected && stored) {
      // User just logged in, allow access and clear the flag
      window.sessionStorage.removeItem('bruno_just_selected');
      setUser(stored);
    } else if (stored) {
      // User still in same session
      setUser(stored);
    } else {
      // No session - redirect to login
      router.replace('/select-user');
    }
  }, [router]);

  // Funktion zum Filtern alter Einträge (älter als 1 Monat)
  const filterOldEntries = <T extends { date: string }>(entries: T[]): T[] => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);
    
    return entries.filter(entry => {
      const parts = entry.date.split('-');
      const entryDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return entryDate >= oneMonthAgo;
    });
  };

  // Funktion zum Filtern alter Datumsstrings
  const filterOldDates = (dates: string[]): string[] => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);
    
    return dates.filter(dateStr => {
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date >= oneMonthAgo;
    });
  };

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: StoredData) => {
        // Filtere alte Einträge raus (älter als 1 Monat)
        const filteredDates = filterOldDates(data.dates || []);
        const filteredLeaRequests = filterOldEntries(data.leaRequests || []);
        const filteredBetreuungEntries = filterOldEntries(data.betreuungEntries || []);
        
        setSelectedDates(filteredDates);
        setLeaRequests(filteredLeaRequests);
        setBetreuungEntries(filteredBetreuungEntries);
        setLoading(false);
        
        // Wenn etwas gefiltert wurde, speichere die bereinigten Daten
        if (filteredDates.length !== (data.dates || []).length ||
            filteredLeaRequests.length !== (data.leaRequests || []).length || 
            filteredBetreuungEntries.length !== (data.betreuungEntries || []).length) {
          fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dates: filteredDates,
              leaRequests: filteredLeaRequests,
              betreuungEntries: filteredBetreuungEntries
            }),
          });
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Admin: Login-Historie laden
  useEffect(() => {
    if (user === 'Admin') {
      fetch('/api/auth?action=logins')
        .then(res => res.json())
        .then(data => {
          if (data.logins) {
            setLoginHistory(data.logins.reverse()); // Neueste zuerst
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const saveData = async (
    dates: string[],
    leaReqs: { date: string; timeFrom: string; timeTo: string; message: string; abholort?: string; transport?: string; helper?: string }[],
    betreuungEntriesParam?: BetreuungEntry[]
  ) => {
    const data: StoredData = { dates, leaRequests: leaReqs, betreuungEntries: betreuungEntriesParam ?? betreuungEntries };
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };
  // Betreuungseintrag speichern
  const submitBetreuungEntry = async () => {
    if (!betreuungDate || !betreuungTimeFrom || !betreuungTimeTo || !user) {
      alert('Bitte alle Felder ausfüllen (Datum, Uhrzeit)!');
      return;
    }
    const newEntry: BetreuungEntry = {
      date: betreuungDate,
      timeFrom: betreuungTimeFrom,
      timeTo: betreuungTimeTo,
      message: betreuungMessage || '',
      abholort: betreuungAbholort || '',
      transport: betreuungTransport || '',
      name: user
    };
    const updatedEntries = [...betreuungEntries, newEntry];
    setBetreuungEntries(updatedEntries);
    await saveData(selectedDates, leaRequests, updatedEntries);
    setBetreuungSubmitted(true);
    setBetreuungDate('');
    setBetreuungTimeFrom('');
    setBetreuungTimeTo('');
    setBetreuungMessage('');
    setBetreuungAbholort('');
    setBetreuungTransport('');
    setTimeout(() => setBetreuungSubmitted(false), 3000);
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

  const getLeaRequestForDate = (date: string) => {
    return leaRequests.find(r => r.date === date);
  };

  const leaNeedsHelpForDate = (dateStr: string) => {
    return leaRequests.some(r => r.date === dateStr);
  };

  const hasHelperForDate = (dateStr: string) => {
    return leaRequests.some(r => r.date === dateStr && r.helper);
  };

  const hasBetreuungForDate = (dateStr: string) => {
    return betreuungEntries.some(e => e.date === dateStr);
  };

  const submitLeaRequest = async () => {
    if (!leaDate || !leaTimeFrom || !leaTimeTo) {
      alert('Bitte waehle Datum und Uhrzeiten aus.');
      return;
    }
    const newRequest = {
      date: leaDate,
      timeFrom: leaTimeFrom,
      timeTo: leaTimeTo,
      message: leaMessage || '',
      abholort: leaAbholort || '',
      transport: leaTransport || ''
    };

    const updatedRequests = [
      ...leaRequests.filter(r => r.date !== leaDate),
      newRequest
    ];

    setLeaRequests(updatedRequests);
    await saveData(selectedDates, updatedRequests);
    setLeaSubmitted(true);
    setLeaDate('');
    setLeaTimeFrom('');
    setLeaTimeTo('');
    setLeaMessage('');
    setLeaAbholort('');
    setLeaTransport('');
    setTimeout(() => setLeaSubmitted(false), 3000);
  };

  const toggleHelper = async (date: string, helperName: string) => {
    const request = leaRequests.find(r => r.date === date);
    if (!request) return;

    // Wenn bereits jemand anderes hilft, nicht überschreiben
    if (request.helper && request.helper !== helperName) {
      return;
    }

    const updatedRequests = leaRequests.map(r => {
      if (r.date === date) {
        if (r.helper === helperName) {
          return { ...r, helper: undefined };
        }
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

  const handleLogout = () => {
    window.sessionStorage.removeItem('bruno_user');
    window.sessionStorage.removeItem('bruno_just_selected');
    window.location.href = '/select-user';
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

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

  if (!user) {
    return null; // oder ein Lade-Spinner
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen py-8 px-2 sm:px-0">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bruno Betreuungskalender</h1>
            <p className="text-gray-600 text-sm">Teile diesen Link mit der Familie</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <span className="text-primary font-semibold">👤 {user}</span>
            </div>
            <button
              onClick={copyLink}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Link kopieren
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Ausloggen
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-300 rounded-2xl shadow p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">&#128054;</span>
          <div>
            <h2 className="text-xl font-bold text-amber-800">Bruno ist in der Kita</h2>
            <p className="text-amber-700 text-lg font-medium">Montag - Freitag: 8:00 - 13:00 Uhr</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-300 space-y-2">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span className="text-xl">!</span>
            <span>Nur <strong>Katja</strong>, <strong>Maren</strong> und <strong>Mareike</strong> duerfen Bruno direkt aus der Kita abholen!</span>
          </p>
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <span className="text-xl">*</span>
            <span>Bitte an den <strong>Kindersitz</strong> denken!</span>
          </p>
        </div>
      </div>

      {/* Absage-Hinweis */}
      <div className="bg-red-50 border border-red-300 rounded-2xl shadow p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">&#9200;</span>
          <div>
            <h2 className="text-xl font-bold text-red-800">Wichtig: Absagen</h2>
            <p className="text-red-700">Absagen sind hier nur <strong>48 Stunden vorher</strong> moeglich.</p>
            <p className="text-red-700">Danach bitte per <strong>WhatsApp</strong> oder <strong>Anruf</strong> absagen!</p>
          </div>
        </div>
      </div>

      {sortedRequests.length > 0 && (
        <div className="bg-green-50 border border-green-300 rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">&#9995;</span>
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
                    <p className="text-green-700">Uhrzeit: {request.timeFrom} - {request.timeTo} Uhr</p>
                    {request.abholort && (
                      <p className="text-green-700">Abholort: {request.abholort}</p>
                    )}
                    {request.transport && (
                      <p className="text-green-700">
                        {request.transport === 'lea_holt_ab' ? 'Lea holt Bruno ab' : 'Bruno muss zurueckgebracht werden'}
                      </p>
                    )}
                    {request.message && (
                      <p className="text-green-600 text-sm mt-1">Nachricht: {request.message}</p>
                    )}
                    {request.helper && (
                      <p className="text-green-800 font-bold mt-1">&#9989; {request.helper} hilft!</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user && user !== 'Lea' && user !== 'Admin' && (
                      <button
                        onClick={() => toggleHelper(request.date, user)}
                        className={"px-4 py-2 rounded-lg font-medium transition-all " +
                          (request.helper === user
                            ? 'bg-green-600 text-white'
                            : request.helper
                              ? 'bg-gray-200 text-gray-500'
                              : 'bg-white border-2 border-green-400 text-green-700 hover:bg-green-50'
                          )
                        }
                      >
                        {request.helper === user ? '\u2713 Ich helfe!' : 'Ich kann helfen!'}
                      </button>
                    )}
                    {request.helper && request.helper !== user && (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                        {request.helper} hilft bereits
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lea Hilfe-Formular - nur für Lea und Admin sichtbar */}
      {(user === 'Lea' || user === 'Admin') && (
        <div className="bg-pink-100 border-2 border-pink-400 rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">&#128105;</span>
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

          <div className="space-y-4">
            <div>
              <label className="block text-pink-800 font-medium mb-2">Datum</label>
              <input
                type="date"
                value={leaDate}
                onChange={(e) => setLeaDate(e.target.value)}
                className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-pink-800 font-medium mb-2">Von</label>
                <input
                  type="time"
                  value={leaTimeFrom}
                  onChange={(e) => setLeaTimeFrom(e.target.value)}
                  className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-pink-800 font-medium mb-2">Bis</label>
                <input
                  type="time"
                  value={leaTimeTo}
                  onChange={(e) => setLeaTimeTo(e.target.value)}
                  className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-pink-800 font-medium mb-2">Abholort</label>
              <input
                type="text"
                placeholder="z.B. Kita, Zuhause, bei Oma..."
                value={leaAbholort}
                onChange={(e) => setLeaAbholort(e.target.value)}
                className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-pink-800 font-medium mb-2">Transport</label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setLeaTransport('lea_holt_ab')}
                  className={"px-4 py-3 rounded-xl font-medium shadow-sm transition-all " +
                    (leaTransport === 'lea_holt_ab'
                      ? 'bg-pink-500 text-white'
                      : 'bg-white border-2 border-pink-300 text-pink-700 hover:bg-pink-50')
                  }
                >
                  Lea holt Bruno ab
                </button>
                <button
                  type="button"
                  onClick={() => setLeaTransport('zurueckbringen')}
                  className={"px-4 py-3 rounded-xl font-medium shadow-sm transition-all " +
                    (leaTransport === 'zurueckbringen'
                      ? 'bg-pink-500 text-white'
                      : 'bg-white border-2 border-pink-300 text-pink-700 hover:bg-pink-50')
                  }
                >
                  Bruno muss zurueckgebracht werden
                </button>
              </div>
            </div>
            <div>
              <label className="block text-pink-800 font-medium mb-2">Nachricht (optional)</label>
              <input
                type="text"
                placeholder="z.B. Bruno muss zum Tierarzt..."
                value={leaMessage}
                onChange={(e) => setLeaMessage(e.target.value)}
                className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={submitLeaRequest}
              disabled={!leaDate || !leaTimeFrom || !leaTimeTo}
              className="w-full py-3 bg-pink-500 text-white font-semibold rounded-xl shadow hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hilfe-Anfrage speichern
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tage auswaehlen</h2>
        <p className="text-gray-600 text-sm mb-4">Klicke auf Tage, fuer die Bruno Betreuung braucht:</p>

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500"></div>
            <span>Familie betreut</span>
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
              &#8592;
            </button>
            <span className="font-bold text-2xl">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-3 hover:bg-gray-100 rounded-lg text-2xl font-bold"
            >
              &#8594;
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
              const hasBetreuung = date ? hasBetreuungForDate(dateStr) : false;

              return (
                <button
                  key={i}
                  onClick={() => toggleDate(date)}
                  disabled={!date || isPast}
                  className={"py-4 rounded-xl text-lg font-semibold transition-all " +
                    (!date ? 'invisible ' : '') +
                    (isPast ? 'text-gray-300 cursor-not-allowed ' : '') +
                    (hasBetreuung
                      ? 'bg-blue-500 text-white ring-2 ring-blue-600 '
                      : hasHelper
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

        {/* Betreuung durch Familie - Liste direkt nach Kalenderübersicht */}
        {betreuungEntries.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Geplante Betreuung durch Familie</h3>
            <div className="space-y-3">
              {betreuungEntries
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((entry, idx) => (
                  <div key={idx} className="rounded-lg p-4 border-2 bg-blue-100 border-blue-400">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-blue-800">{formatDateDisplay(entry.date)}</h4>
                        <p className="text-blue-700">Uhrzeit: {entry.timeFrom} - {entry.timeTo} Uhr</p>
                        {entry.abholort && (
                          <p className="text-blue-700">Abholort: {entry.abholort}</p>
                        )}
                        {entry.transport && (
                          <p className="text-blue-700">
                            {entry.transport === 'selbst_abholen' ? 'Ich hole Bruno ab' : 'Bruno muss zurückgebracht werden'}
                          </p>
                        )}
                        {entry.message && (
                          <p className="text-blue-600 text-sm mt-1">Nachricht: {entry.message}</p>
                        )}
                        <p className="text-blue-800 font-bold mt-1">👤 {entry.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Betreuung durch Familie - neues Feld */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl shadow-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">👨‍👩‍👧‍👦</span>
          <div>
            <h2 className="text-xl font-bold text-blue-800">Familie übernimmt Betreuung</h2>
            <p className="text-blue-700">Hier kann jeder eintragen, wenn er Bruno für einen Zeitraum nimmt (ohne Anfrage von Lea).</p>
          </div>
        </div>

        {betreuungSubmitted && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-blue-800 font-semibold">Gespeichert! Dein Eintrag wurde hinzugefügt.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-blue-800 font-medium mb-2">Datum</label>
            <input
              type="date"
              value={betreuungDate}
              onChange={(e) => setBetreuungDate(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-800 font-medium mb-2">Von</label>
              <input
                type="time"
                value={betreuungTimeFrom}
                onChange={(e) => setBetreuungTimeFrom(e.target.value)}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-blue-800 font-medium mb-2">Bis</label>
              <input
                type="time"
                value={betreuungTimeTo}
                onChange={(e) => setBetreuungTimeTo(e.target.value)}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-blue-800 font-medium mb-2">Abholort</label>
            <input
              type="text"
              placeholder="z.B. Kita, Zuhause, bei Oma..."
              value={betreuungAbholort}
              onChange={(e) => setBetreuungAbholort(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-blue-800 font-medium mb-2">Transport</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setBetreuungTransport('selbst_abholen')}
                className={"px-4 py-3 rounded-lg font-medium transition-all " +
                  (betreuungTransport === 'selbst_abholen'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50')
                }
              >
                Ich hole Bruno ab
              </button>
              <button
                type="button"
                onClick={() => setBetreuungTransport('zurueckbringen')}
                className={"px-4 py-3 rounded-lg font-medium transition-all " +
                  (betreuungTransport === 'zurueckbringen'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50')
                }
              >
                Bruno muss zurückgebracht werden
              </button>
            </div>
          </div>
          <div>
            <label className="block text-blue-800 font-medium mb-2">Nachricht (optional)</label>
            <input
              type="text"
              placeholder="z.B. Wir gehen auf den Spielplatz..."
              value={betreuungMessage}
              onChange={(e) => setBetreuungMessage(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-blue-800 font-medium mb-2">Wer übernimmt die Betreuung?</label>
            <div className="w-full px-4 py-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 font-semibold">
              👤 {user}
            </div>
          </div>
          <button
            onClick={submitBetreuungEntry}
            disabled={!betreuungDate || !betreuungTimeFrom || !betreuungTimeTo}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Betreuung eintragen
          </button>
        </div>
      </div>

      {/* Admin: Login-Historie */}
      {user === 'Admin' && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl shadow-xl p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📋</span>
            <div>
              <h2 className="text-xl font-bold text-purple-800">Login-Historie</h2>
              <p className="text-purple-700">Übersicht wer sich wann eingeloggt hat</p>
            </div>
          </div>

          {loginHistory.length === 0 ? (
            <p className="text-purple-600 text-center py-4">Noch keine Logins aufgezeichnet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-purple-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-purple-800 font-semibold">Benutzer</th>
                    <th className="text-left px-3 py-2 text-purple-800 font-semibold">Datum & Uhrzeit</th>
                    <th className="text-left px-3 py-2 text-purple-800 font-semibold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry, index) => {
                    const date = new Date(entry.timestamp);
                    const formattedDate = date.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    const formattedTime = date.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                        <td className="px-3 py-2 text-purple-900 font-medium">{entry.name}</td>
                        <td className="px-3 py-2 text-purple-700">{formattedDate}, {formattedTime} Uhr</td>
                        <td className="px-3 py-2">
                          {entry.type === 'login' ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ Login
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              🔑 Passwort gesetzt
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
