"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/video-player';
import { Loader2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_KEY = "001bbf841bab48f314947688a8230535";
const API_BASE_URL = "https://api.themoviedb.org/3";

type Stream = { url: string; name: string; description: string; proxyHeaders?: any };
type MovieDetails = { title: string; backdrop_path: string | null };

export default function MovieEmbedPage() {
  const params = useParams();
  const tmdbId = params.tmdbId as string;

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tmdbId) return;

    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const detailsRes = await fetch(`${API_BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (!detailsRes.ok) throw new Error("Filme não encontrado.");
        const movieDetails = await detailsRes.json();
        setMovie(movieDetails);

        const streamRes = await fetch(`/api/stream/movies/${tmdbId}`);
        if (!streamRes.ok) throw new Error("Não foi possível obter os links.");
        
        const streamData = await streamRes.json();
        if (!streamData.streams || streamData.streams.length === 0) {
          throw new Error("OPS, ESTE TÍTULO ESTÁ SEM LINK, MANÉ! ESCOLHE OUTRO.");
        }
        
        setStreams(streamData.streams);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [tmdbId]);

  const getProxyVideoUrl = (stream: Stream) => {
    const p = new URLSearchParams();
    p.append("videoUrl", stream.url);
    if (stream.proxyHeaders) {
        p.append("headers", encodeURIComponent(JSON.stringify(stream.proxyHeaders.request || stream.proxyHeaders)));
    }
    return `/api/video-proxy?${p.toString()}`;
  }

  const backgroundStyle = movie?.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/original/${movie.backdrop_path})` } : {};

  if (loading) {
    return <main className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-12 h-12 animate-spin text-white" /></main>;
  }
  
  if (error) {
    return <main className="w-full h-full flex items-center justify-center bg-black p-4"><p className="text-red-500 text-center font-bold text-lg max-w-md">{error}</p></main>;
  }
  
  if (selectedStream) {
    return (
      <main className="w-full h-full flex items-center justify-center bg-black">
        <VideoPlayer 
          src={getProxyVideoUrl(selectedStream)} 
          title={movie?.title || 'Player'}
          onShowOptions={() => setSelectedStream(null)}
          mediaType="movie"
        />
      </main>
    );
  }

  return (
    <main className="w-full h-full bg-cover bg-center text-white flex items-center justify-center p-4" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-2">{movie?.title}</h1>
        <p className="text-zinc-400 mb-6">Selecione um servidor Dublado</p>
        <div className="mt-4 space-y-2">
            {streams.map((stream, index) => (
              <Button key={index} onClick={() => setSelectedStream(stream)} className="w-full h-12 bg-zinc-800/60 hover:bg-zinc-700/80 text-white font-semibold flex items-center justify-center gap-2">
                <Tv className="w-5 h-5" /> {stream.name || 'Servidor'}
              </Button>
            ))}
        </div>
      </div>
    </main>
  );
}