"use client"

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Stream = { url: string; };

export default function MovieEmbedPage() {
  const params = useParams();
  const tmdbId = params.tmdbId as string;
  
  useEffect(() => {
    if (!tmdbId) return;

    const fetchStreamAndRedirect = async () => {
        try {
            const res = await fetch(`/api/stream/movies/${tmdbId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.streams && data.streams.length > 0) {
                    const abyssStream = data.streams[0]; // Pega o primeiro link da Abyss encontrado
                    if (abyssStream && abyssStream.url) {
                        window.location.href = abyssStream.url; // Redireciona o usuário
                        return;
                    }
                }
            }
            // Se não encontrar, pode mostrar uma mensagem de erro ou redirecionar para a home
        } catch (error) {
            console.error("Failed to fetch stream URL", error);
        }
    };

    fetchStreamAndRedirect();
  }, [tmdbId]);

  // Exibe um loader enquanto o redirecionamento acontece
  return (
    <main className="w-screen h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </main>
  );
}