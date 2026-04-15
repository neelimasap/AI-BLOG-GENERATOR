import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const headlineFont = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-headline',
  weight: '100 900',
  display: 'swap',
});

const bodyFont = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-body',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Blog Generator',
  description: 'Research, outline, write, and illustrate blog posts with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headlineFont.variable} ${bodyFont.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
