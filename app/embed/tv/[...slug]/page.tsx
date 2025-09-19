"use client"

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Stream = { url: string; playerType: 'abyss'; };

export default function TvEmbedPage() {
  const params = useParams();
  const slug = params.slug as string[];

  const tmdbId = slug?.[0];
  const seasonNumber = slug?.[1];
  const episodeNumber = slug?.[2];
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tmdbId || !seasonNumber || !episodeNumber) return;
    
    const fetchStream = async () => {
        try {
            const res = await fetch(`/api/stream/series/${tmdbId}/${seasonNumber}/${episodeNumber}`);
            if (res.ok) {
                const data = await res.json();
                if (data.streams && data.streams.length > 0) {
                    const abyssStream = data.streams.find((s: Stream) => s.playerType === 'abyss');
                    if(abyssStream) {
                        setStreamUrl(abyssStream.url);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch stream URL", error);
        } finally {
            setLoading(false);
        }
    };
    fetchStream();
  }, [tmdbId, seasonNumber, episodeNumber]);

  if (loading || !streamUrl) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="w-screen h-screen flex items-center justify-center bg-black">
      <iframe
        src={streamUrl}
        allowFullScreen
        className="w-full h-full border-0"
      ></iframe>
    </main>
  );
}