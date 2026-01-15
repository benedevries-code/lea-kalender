'use client';

import { useEffect, useState } from 'react';

function PersonIcon({ type, size }: { type: string; size: number }) {
  const color = type === 'W' ? '#ec4899' : type === 'M' ? '#3b82f6' : '#f59e0b';
  
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none">
      <circle cx="20" cy="10" r="8" fill={color} />
      <ellipse cx="20" cy="30" rx="10" ry="12" fill={color} />
      <line x1="10" y1="25" x2="5" y2="35" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="30" y1="25" x2="35" y2="35" stroke={color} strokeWidth="4" strokeLinecap="round" />
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

const POSITIONS = [
  { name: 'Katja', type: 'W', top: '15%', left: '5%' },
  { name: 'Maren', type: 'W', top: '25%', left: '90%' },
  { name: 'Mareike', type: 'W', top: '60%', left: '8%' },
  { name: 'Noah', type: 'M', top: '45%', left: '92%' },
  { name: 'Volker', type: 'M', top: '70%', left: '85%' },
  { name: 'Lukas', type: 'M', top: '35%', left: '3%' },
  { name: 'Mandy', type: 'W', top: '80%', left: '12%' },
];

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {POSITIONS.map((person, i) => (
        <div
          key={person.name}
          className="absolute opacity-15 animate-float-updown"
          style={{
            top: person.top,
            left: person.left,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <div className="flex flex-col items-center animate-sway" style={{ animationDelay: `${i * 0.3}s` }}>
            <PersonIcon type={person.type} size={40} />
            <span className="text-xs text-gray-400 font-medium mt-1">{person.name}</span>
          </div>
        </div>
      ))}
      <div className="absolute animate-walk opacity-25" style={{ top: '88%' }}>
        <div className="flex items-end gap-2">
          <div className="animate-bounce-slow">
            <PersonIcon type="B" size={35} />
          </div>
          <BallIcon size={18} />
        </div>
        <span className="text-xs text-gray-400 font-medium block text-center mt-1">Bruno</span>
      </div>
    </div>
  );
}
