import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Serif_Display, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Blog Generator',
  description: 'Research, outline, write, and illustrate blog posts with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(dmSerif.variable, "font-sans", instrumentSans.variable)}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
