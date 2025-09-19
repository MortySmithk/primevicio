"use client"

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';

export default function MovieEmbedPage() {
  const params = useParams();
  const tmdbId = params.tmdbId as string;

  if (!tmdbId) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="w-screen h-screen flex items-center justify-center bg-black">
      <iframe
        src={`https://ultraembed.fun/filme/${tmdbId}`}
        allowFullScreen
        className="w-full h-full border-0"
      ></iframe>
    </main>
  );
}