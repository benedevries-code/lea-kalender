'use client';

import { useEffect, useState } from 'react';

interface Character {
  id: number;
  emoji: string;
  name: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

const FAMILY = [
  { emoji: '👩', name: 'Katja' },
  { emoji: '👩', name: 'Maren' },
  { emoji: '👩', name: 'Mareike' },
  { emoji: '👨', name: 'Noah' },
  { emoji: '👨', name: 'Volker' },
  { emoji: '👨', name: 'Lukas' },
  { emoji: '👩', name: 'Mandy' },
  { emoji: '👶', name: 'Bruno' },
];

export default function AnimatedBackground() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    // Erstelle zufällige Charaktere
    const chars: Character[] = FAMILY.map((person, i) => ({
      id: i,
      emoji: person.emoji,
      name: person.name,
      left: Math.random() * 80 + 10, // 10-90%
      duration: 15 + Math.random() * 20, // 15-35 Sekunden
      delay: i * 3, // Versetzt starten
      size: person.name === 'Bruno' ? 2 : 1.5, // Bruno etwas größer
    }));
    setCharacters(chars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
      {characters.map((char) => (
        <div
          key={char.id}
          className="absolute animate-float"
          style={{
            left: `${char.left}%`,
            animationDuration: `${char.duration}s`,
            animationDelay: `${char.delay}s`,
            fontSize: `${char.size}rem`,
          }}
        >
          <div className="flex flex-col items-center animate-bounce-slow">
            <span>{char.emoji}</span>
            <span className="text-xs text-gray-400 font-medium">{char.name}</span>
          </div>
        </div>
      ))}
      
      {/* Bruno spielt mit Ball */}
      <div 
        className="absolute animate-walk"
        style={{ fontSize: '2.5rem' }}
      >
        <div className="flex items-center gap-2">
          <span className="animate-bounce-slow">👶</span>
          <span className="animate-roll">⚽</span>
        </div>
        <span className="text-xs text-gray-400 font-medium block text-center">Bruno</span>
      </div>
    </div>
  );
}
