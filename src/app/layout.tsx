import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from '@/components/ThemeProvider';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import Link from 'next/link';
import { BookOpen, Trophy, LayoutDashboard, BrainCircuit } from 'lucide-react';

function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-xl tracking-tight">
          QuantGuide
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link href="/" className="hover:text-white flex items-center gap-2 transition-colors"><BookOpen className="w-4 h-4"/> Problems</Link>
          <Link href="/leaderboard" className="hover:text-white flex items-center gap-2 transition-colors"><Trophy className="w-4 h-4"/> Leaderboard</Link>
          <Link href="/sets" className="hover:text-white flex items-center gap-2 transition-colors"><LayoutDashboard className="w-4 h-4"/> Sets</Link>
          <Link href="/review" className="hover:text-white flex items-center gap-2 transition-colors"><BrainCircuit className="w-4 h-4"/> Review</Link>
          <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
        </div>
      </div>
    </nav>
  );
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuantGuide | Master Quantitative Finance",
  description: "The ultimate platform for quantitative finance interview preparation, featuring over 1,200 problems with step-by-step solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#3b82f6" height={3} showSpinner={false} />
        <NextAuthProvider>
          <ThemeProvider>
            <Navbar />
            <KeyboardShortcuts />
            <main className="flex-1">
              {children}
            </main>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
