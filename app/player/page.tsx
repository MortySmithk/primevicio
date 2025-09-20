// app/player/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Clapperboard, Loader2 } from 'lucide-react';

function PlayerComponent() {
  const searchParams = useSearchParams();
  const streamUrl = searchParams.get('url');

  if (!streamUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-white">
        <Clapperboard className="h-16 w-16 text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold">URL do Player não encontrada</h2>
        <p className="text-zinc-400">Não foi possível carregar o vídeo.</p>
      </div>
    );
  }

  return (
    <iframe
      src={streamUrl}
      title="PrimeVicio Player"
      className="h-full w-full"
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      frameBorder="0"
      scrolling="no"
    ></iframe>
  );
}

// O uso de useSearchParams requer que o componente seja envolvido por um <Suspense>
export default function PlayerPage() {
    return (
        <main className="h-screen w-screen bg-black">
            <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
            }>
                <PlayerComponent />
            </Suspense>
        </main>
    );
}