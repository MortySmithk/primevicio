// app/embed/tv/[...slug]/page.tsx
"use client"

import { useParams } from 'next/navigation';
import { Loader2, Tv } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function TvEmbedPage() {
  const params = useParams();
  const slug = params.slug as string[];

  const tmdbId = slug?.[0];
  const seasonNumber = slug?.[1];
  const episodeNumber = slug?.[2];

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tmdbId || !seasonNumber || !episodeNumber) {
        setError("Parâmetros inválidos para carregar o episódio.");
        setLoading(false);
        return;
    }
    
    const fetchAndLoadPlayer = async () => {
        try {
            const res = await fetch(`/api/stream/series/${tmdbId}/${seasonNumber}/${episodeNumber}`);
            if (res.ok) {
                const data = await res.json();
                const abyssStream = data.streams?.find((s: any) => s.playerType === 'abyss' && s.url);

                if (abyssStream) {
                    // MODIFICADO: Redireciona para a página de player interna
                    const playerPageUrl = `/player?url=${encodeURIComponent(abyssStream.url)}`;
                    window.location.href = playerPageUrl;
                    return;
                }
                setError("Nenhum link de streaming disponível para este episódio.");
            } else {
                setError("Falha ao buscar os links de streaming do nosso servidor.");
            }
        } catch (error) {
            console.error("Erro ao buscar a URL do stream", error);
            setError("Ocorreu um erro ao tentar carregar o episódio.");
        } finally {
            setLoading(false);
        }
    };
    fetchAndLoadPlayer();
  }, [tmdbId, seasonNumber, episodeNumber]);

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-4">
    {loading && <Loader2 className="w-12 h-12 animate-spin text-white" />}
    {error && (
        <>
            <Tv className="w-16 h-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
            <p className="text-zinc-400 text-center">{error}</p>
        </>
    )}
  </main>
  );
}