import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DarkModeToggle from '@/components/DarkModeToggle';
import AnimatedBackground from '@/components/AnimatedBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bruno & Lea - Unser Kalender',
  description: 'Unser gemeinsamer Kalender fuer die ganze Familie.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='de'>
      <body className={inter.className}>
        <AnimatedBackground />
        <div className='min-h-screen bg-gray-50 relative z-10'>
          <header className='gradient-bg text-white py-4 shadow-lg'>
            <div className='container mx-auto px-4 flex items-center justify-between'>
              <a href='/' className='text-2xl font-bold'>Bruno & Lea</a>
              <DarkModeToggle />
            </div>
          </header>
          <main className='container mx-auto px-4 py-8'>
            {children}
          </main>
          <footer className='text-center py-6 text-gray-500 text-sm'>
            <p>Bruno & Lea 2026</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
