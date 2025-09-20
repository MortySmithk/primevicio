// app/embed/movie/[tmdbId]/page.tsx
"use client"

import { useParams } from 'next/navigation';
import { Loader2, Clapperboard } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function MovieEmbedPage() {
  const params = useParams();
  const tmdbId = params.tmdbId as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!tmdbId) {
      setError("ID do filme não fornecido.");
      setLoading(false);
      return;
    };

    const fetchStreamAndRedirect = async () => {
        try {
            const res = await fetch(`/api/stream/movies/${tmdbId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.streams && data.streams.length > 0 && data.streams[0].url) {
                    // REDIRECIONA PARA O PLAYER
                    window.location.href = data.streams[0].url;
                    return; 
                }
                setError("Nenhum link de streaming disponível para este filme.");
            } else {
              setError("Falha ao buscar os links de streaming do nosso servidor.");
            }
        } catch (error) {
            console.error("Erro ao buscar a URL do stream", error);
            setError("Ocorreu um erro ao tentar carregar o filme.");
        } finally {
            setLoading(false);
        }
    };

    fetchStreamAndRedirect();
  }, [tmdbId]);

  return (
      <main className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        {loading && <Loader2 className="w-12 h-12 animate-spin text-white" />}
        {error && (
            <>
                <Clapperboard className="w-16 h-16 text-zinc-700 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
                <p className="text-zinc-400 text-center">{error}</p>
            </>
        )}
      </main>
  );
}