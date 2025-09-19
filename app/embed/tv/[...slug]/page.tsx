"use client"

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

type Stream = { url: string; };

export default function TvEmbedPage() {
  const params = useParams();
  const slug = params.slug as string[];

  const tmdbId = slug?.[0];
  const seasonNumber = slug?.[1];
  const episodeNumber = slug?.[2];

  useEffect(() => {
    if (!tmdbId || !seasonNumber || !episodeNumber) return;
    
    const fetchStreamAndRedirect = async () => {
        try {
            const res = await fetch(`/api/stream/series/${tmdbId}/${seasonNumber}/${episodeNumber}`);
            if (res.ok) {
                const data = await res.json();
                if (data.streams && data.streams.length > 0) {
                    const abyssStream = data.streams[0]; // Pega o primeiro link da Abyss
                    if(abyssStream && abyssStream.url) {
                        window.location.href = abyssStream.url; // Redireciona o usuário
                        return;
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch stream URL", error);
        }
    };
    fetchStreamAndRedirect();
  }, [tmdbId, seasonNumber, episodeNumber]);

  // Exibe um loader enquanto o redirecionamento acontece
  return (
    <main className="w-screen h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </main>
  );
}