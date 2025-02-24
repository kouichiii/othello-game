"use client";

import dynamic from 'next/dynamic';

const OthelloBoard = dynamic(() => import('./othello-board'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
    </div>
  ),
});

export default function OthelloGame() {
  return <OthelloBoard />;
} 