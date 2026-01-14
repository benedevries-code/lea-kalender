import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LEA Kalender - Terminplanung leicht gemacht',
  description: 'Erstelle einen Kalender und teile ihn mit anderen, um gemeinsame Termine zu finden.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="gradient-bg text-white py-4 shadow-lg">
            <div className="container mx-auto px-4">
              <a href="/" className="text-2xl font-bold">📅 LEA Kalender</a>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="text-center py-6 text-gray-500 text-sm">
            LEA Kalender © 2026 - Finde den perfekten Termin
          </footer>
        </div>
      </body>
    </html>
  );
}
