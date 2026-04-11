import './globals.css';
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { Geist, Geist_Mono, Inter, Roboto } from "next/font/google";
/**
 * BEST PRACTICE: Use Variable Fonts for Retina.
 * Variable fonts are sharper and allow for fluid weight scaling.
 */

export const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
  axes: ["wght"],
  preload: true,
});

export const geistMono = Geist_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const fontInter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["wght"],
  preload: true,
});

export const roboto = Roboto({
  weight: ["100", "400", "700"], // Added standard weights to prevent fallback flicker
  style: ["italic", "normal"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-roboto",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }, // Adjusted for OLED deep black
  ],
  width: "device-width",
  userScalable: false,
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: 'AI Blog Generator',
  description: 'Research, outline, write, and illustrate blog posts with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(geistSans.variable, fontInter.variable, geistMono.variable, "antialiased")}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
