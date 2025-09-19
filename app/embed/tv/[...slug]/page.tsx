"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/video-player';
import { Loader2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_KEY = "001bbf841bab48f314947688a8230535";
const API_BASE_URL = "https://api.themoviedb.org/3";

type Stream = { url: string; name: string; description: string; proxyHeaders?: any; playerType: 'custom' | 'abyss'; spriteUrl?: string; };
type Episode = { id: number; name: string; episode_number: number; still_path: string | null; air_date: string };
type Season = { id: number; name: string; season_number: number; };
type TVDetails = { name: string; backdrop_path: string | null; seasons: Season[] };

export default function TvEmbedPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string[];

  const tmdbId = slug?.[0];
  const seasonNumber = slug?.[1];
  const episodeNumber = slug?.[2];

  const [view, setView] = useState<'loading' | 'episode-selection' | 'server-selection' | 'playing'>('loading');

  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>(seasonNumber || "1");
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbId) return;
    const fetchInitialData = async () => {
      setView('loading');
      setError(null);
      try {
        const detailsRes = await fetch(`${API_BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (!detailsRes.ok) throw new Error("Série não encontrada.");
        const detailsData = await detailsRes.json();
        setTvDetails(detailsData);

        const seasonToFetch = seasonNumber || String(detailsData.seasons.find((s: Season) => s.season_number > 0)?.season_number || 1);
        setSelectedSeason(seasonToFetch);

        const seasonRes = await fetch(`${API_BASE_URL}/tv/${tmdbId}/season/${seasonToFetch}?api_key=${API_KEY}&language=pt-BR`);
        const seasonData = await seasonRes.json();
        setEpisodes(seasonData.episodes || []);

        if (seasonNumber && episodeNumber) {
          const episodeData = seasonData.episodes?.find((e: Episode) => e.episode_number === parseInt(episodeNumber));
          if (episodeData) {
            setSelectedEpisode(episodeData);
            await fetchStreams(tmdbId, seasonNumber, episodeNumber);
          } else {
            setView('episode-selection');
          }
        } else {
          setView('episode-selection');
        }

      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchInitialData();
  }, [tmdbId, seasonNumber, episodeNumber]);

  const fetchStreams = async (id: string, season: string, episode: string) => {
    setView('loading');
    try {
      const streamRes = await fetch(`/api/stream/series/${id}/${season}/${episode}`);
      if (!streamRes.ok) throw new Error("Não foi possível obter os links.");
      const streamData = await streamRes.json();
      if (!streamData.streams || streamData.streams.length === 0) {
        throw new Error("OPS, ESTE TÍTULO ESTÁ SEM LINK, MANÉ! ESCOLHE OUTRO.");
      }
      setStreams(streamData.streams);
      setView('server-selection');
    } catch (err: any) {
      setError(err.message);
    }
  }

  const backgroundStyle = tvDetails?.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/original/${tvDetails.backdrop_path})` } : {};

  if (view === 'loading') {
    return <main className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-12 h-12 animate-spin text-white" /></main>;
  }

  if (error) {
    return <main className="w-full h-full flex items-center justify-center bg-black p-4"><p className="text-red-500 text-center font-bold text-lg max-w-md">{error}</p></main>;
  }

  const getProxyVideoUrl = (stream: Stream) => {
    const p = new URLSearchParams();
    p.append("videoUrl", stream.url);
    if (stream.proxyHeaders) {
        p.append("headers", encodeURIComponent(JSON.stringify(stream.proxyHeaders.request || stream.proxyHeaders)));
    }
    return `/api/video-proxy?${p.toString()}`;
  }


  if (view === 'playing' && selectedStream) {
    if (selectedStream.playerType === 'custom') {
      return (
        <main className="w-full h-full flex items-center justify-center bg-black">
          <VideoPlayer
            src={getProxyVideoUrl(selectedStream)}
            title={`${tvDetails?.name || 'Player'} - S${seasonNumber}E${episodeNumber}`}
            onShowOptions={() => setView('episode-selection')}
            mediaType="tv"
            tmdbId={tmdbId}
            seasons={tvDetails?.seasons}
            currentSeason={Number(seasonNumber)}
            currentEpisode={Number(episodeNumber)}
          />
        </main>
      );
    }
    if (selectedStream.playerType === 'abyss') {
      return (
        <main className="w-full h-full flex items-center justify-center bg-black">
            <div className="absolute top-2 left-2 z-20">
                <Button onClick={() => setView('episode-selection')}>Voltar aos episódios</Button>
            </div>
          <iframe src={selectedStream.url} allowFullScreen className="w-full h-full border-0"></iframe>
        </main>
      );
    }
  }


  if (view === 'server-selection') {
      return (
        <main className="w-full h-full bg-cover bg-center text-white flex items-start justify-center p-4 pt-12 md:pt-24" style={backgroundStyle}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-2">{tvDetails?.name}</h1>
            <h2 className="text-lg text-zinc-300">S{seasonNumber} E{episodeNumber}: {selectedEpisode?.name}</h2>
            <p className="text-zinc-400 mb-6">Selecione um servidor para assistir</p>
            <div className="mt-4 space-y-2">
                {streams.map((stream, index) => (
                  <Button key={index} onClick={() => { setSelectedStream(stream); setView('playing'); }} className="w-full h-12 bg-zinc-800/60 hover:bg-zinc-700/80 text-white font-semibold flex items-center justify-center gap-2">
                    <Tv className="w-5 h-5" /> {stream.name || 'Servidor'}
                  </Button>
                ))}
            </div>
          </div>
        </main>
      )
  }


  if (view === 'episode-selection') {
    return (
      <main className="w-full h-full bg-cover bg-center text-white flex" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-sm bg-zinc-900/70 h-full flex flex-col">
            <div className="p-4 border-b border-zinc-800">
                <h2 className="text-lg font-bold">{tvDetails?.name}</h2>
                <Select onValueChange={(s) => router.push(`/embed/tv/${tmdbId}/${s}`)} defaultValue={selectedSeason}>
                    <SelectTrigger className="w-full mt-2 bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Selecione a temporada" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                        {tvDetails?.seasons.filter(s => s.season_number > 0).map(s => (
                            <SelectItem key={s.id} value={String(s.season_number)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {episodes.map(ep => (
                        <Link key={ep.id} href={`/embed/tv/${tmdbId}/${selectedSeason}/${ep.episode_number}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors">
                            <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300/${ep.still_path}` : '/placeholder.jpg'} alt={ep.name} className="w-28 rounded aspect-video object-cover bg-zinc-800" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm line-clamp-2">{ep.episode_number}. {ep.name}</p>
                                {ep.air_date && <p className="text-xs text-zinc-400 mt-1">Exibido em {new Date(ep.air_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                            </div>
                        </Link>
                    ))}
                </div>
            </ScrollArea>
        </div>
        <div className="flex-1 hidden md:block"></div>
      </main>
    );
  }

  return <main className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-12 h-12 animate-spin text-white" /></main>;
}