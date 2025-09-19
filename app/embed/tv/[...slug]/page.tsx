"use client"

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';

export default function TvEmbedPage() {
  const params = useParams();
  const slug = params.slug as string[];

  const tmdbId = slug?.[0];
  const seasonNumber = slug?.[1];
  const episodeNumber = slug?.[2];

  if (!tmdbId || !seasonNumber || !episodeNumber) {
    return (
      <main className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="w-full h-full flex items-center justify-center bg-black">
      <iframe
        src={`https://ultraembed.fun/serie/${tmdbId}/${seasonNumber}/${episodeNumber}`}
        allowFullScreen
        className="w-full h-full border-0"
      ></iframe>
    </main>
  );
}