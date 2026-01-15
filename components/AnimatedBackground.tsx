'use client';

import { useEffect, useState } from 'react';

interface Character {
  id: number;
  symbol: string;
  name: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
  isBaby: boolean;
}

const FAMILY = [
  { symbol: 'W', name: 'Katja', isBaby: false },
  { symbol: 'W', name: 'Maren', isBaby: false },
  { symbol: 'W', name: 'Mareike', isBaby: false },
  { symbol: 'M', name: 'Noah', isBaby: false },
  { symbol: 'M', name: 'Volker', isBaby: false },
  { symbol: 'M', name: 'Lukas', isBaby: false },
  { symbol: 'W', name: 'Mandy', isBaby: false },
  { symbol: 'B', name: 'Bruno', isBaby: true },
];

function PersonIcon({ type, size }: { type: string; size: number }) {
  const color = type === 'W' ? '#ec4899' : type === 'M' ? '#3b82f6' : '#f59e0b';
  const height = type === 'B' ? size * 0.7 : size;
  
  return (
    <svg width={size} height={height} viewBox="0 0 40 50" fill="none">
      {/* Kopf */}
      <circle cx="20" cy="10" r="8" fill={color} />
      {/* Koerper */}
      <ellipse cx="20" cy="30" rx="10" ry="12" fill={color} />
      {/* Arme */}
      <line x1="10" y1="25" x2="5" y2="35" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="30" y1="25" x2="35" y2="35" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Beine */}
      <line x1="15" y1="40" x2="12" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="25" y1="40" x2="28" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function BallIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" className="animate-roll">
      <circle cx="15" cy="15" r="12" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
      <path d="M15 3 L15 27 M3 15 L27 15" stroke="#16a34a" strokeWidth="1" />
    </svg>
  );
}

export default function AnimatedBackground() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const chars: Character[] = FAMILY.map((person, i) => ({
      id: i,
      symbol: person.symbol,
      name: person.name,
      left: 10 + (i * 10),
      duration: 20 + Math.random() * 15,
      delay: i * 2,
      size: person.isBaby ? 35 : 45,
      isBaby: person.isBaby,
    }));
    setCharacters(chars);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Schwebende Familienmitglieder */}
      {characters.filter(c => !c.isBaby).map((char) => (
        <div
          key={char.id}
          className="absolute animate-float opacity-20"
          style={{
            left: `${char.left}%`,
            animationDuration: `${char.duration}s`,
            animationDelay: `${char.delay}s`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="animate-bounce-slow">
              <PersonIcon type={char.symbol} size={char.size} />
            </div>
            <span className="text-xs text-gray-500 font-medium mt-1">{char.name}</span>
          </div>
        </div>
      ))}

      {/* Bruno mit Ball - laeuft von links nach rechts */}
      <div className="absolute animate-walk opacity-30">
        <div className="flex items-end gap-2">
          <div className="animate-bounce-slow">
            <PersonIcon type="B" size={40} />
          </div>
          <BallIcon size={20} />
        </div>
        <span className="text-xs text-gray-500 font-medium block text-center mt-1">Bruno</span>
      </div>
    </div>
  );
}
