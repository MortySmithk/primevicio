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

type Stream = { url: string; name: string; description: string; proxyHeaders?: any };
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
  
  const [view, setView] = useState<'loading' | 'episode-selection' | 'playing'>('loading');
  
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>(seasonNumber || "1");

  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Decide se mostra a seleção de servidor ou vai direto pro player
  const [currentEpisodeDetails, setCurrentEpisodeDetails] = useState<Episode | null>(null);


  useEffect(() => {
    if (!tmdbId) return;
    const fetchTvAndEpisodeData = async () => {
      setView('loading');
      setError(null);
      try {
        const detailsRes = await fetch(`${API_BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
        if (!detailsRes.ok) throw new Error("Série não encontrada.");
        const detailsData = await detailsRes.json();
        setTvDetails(detailsData);
        
        if (seasonNumber && episodeNumber) {
            const streamRes = await fetch(`/api/stream/series/${tmdbId}/${seasonNumber}/${episodeNumber}`);
            if (!streamRes.ok) throw new Error("Não foi possível obter os links.");
            const streamData = await streamRes.json();
            if (!streamData.streams || streamData.streams.length === 0) {
              throw new Error("OPS, ESTE TÍTULO ESTÁ SEM LINK, MANÉ! ESCOLHE OUTRO.");
            }
            setStreams(streamData.streams);

            const seasonRes = await fetch(`${API_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR`);
            const seasonData = await seasonRes.json();
            setEpisodes(seasonData.episodes || []);
            const currentEp = seasonData.episodes?.find((e: Episode) => e.episode_number == parseInt(episodeNumber));
            setCurrentEpisodeDetails(currentEp);

            // Se encontrou streams, vai para o player
            setView('playing');

        } else {
          // Se faltar S/E, vai para a seleção de episódios
          const seasonRes = await fetch(`${API_BASE_URL}/tv/${tmdbId}/season/1?api_key=${API_KEY}&language=pt-BR`);
          const seasonData = await seasonRes.json();
          setEpisodes(seasonData.episodes || []);
          setView('episode-selection');
        }

      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchTvAndEpisodeData();
  }, [tmdbId, seasonNumber, episodeNumber]);

  const backgroundStyle = tvDetails?.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/original/${tvDetails.backdrop_path})` } : {};

  if (view === 'loading') {
    return <div className="bg-black w-screen h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>;
  }
  
  if (error) {
    return <div className="bg-black w-screen h-screen flex items-center justify-center p-4"><p className="text-red-500 text-center font-bold text-lg max-w-md">{error}</p></div>;
  }
  
  if (view === 'playing' && streams.length > 0) {
    const streamToPlay = streams[0]; // Pega o primeiro servidor por padrão
    const proxyUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(streamToPlay.url)}&headers=${encodeURIComponent(JSON.stringify(streamToPlay.proxyHeaders?.request || {}))}`;
    
    return (
      <VideoPlayer 
        src={proxyUrl}
        title={`${tvDetails?.name || 'Player'} - S${seasonNumber}E${episodeNumber}`}
        mediaType="tv"
        tmdbId={tmdbId}
        seasons={tvDetails?.seasons}
        initialEpisodes={episodes}
        currentSeason={parseInt(seasonNumber || '1')}
        currentEpisode={parseInt(episodeNumber || '1')}
      />
    );
  }

  // Tela de seleção de episódio (Fallback)
  if (view === 'episode-selection') {
    return (
      <div className="w-screen h-screen bg-black bg-cover bg-center text-white flex" style={backgroundStyle}>
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
      </div>
    );
  }

  return <div className="bg-black w-screen h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>;
}