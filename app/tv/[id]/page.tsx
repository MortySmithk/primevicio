"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Calendar, Tv, Heart, Play, Loader2, ShieldAlert } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useFavorites, type FavoriteItem } from "@/components/favorites-context"
import { cn } from "@/lib/utils"
import VideoPlayer from "@/components/video-player"

const API_KEY = "001bbf841bab48f314947688a8230535"
const API_BASE_URL = "https://api.themoviedb.org/3";

// --- TIPOS ---
type TVDetails = { id: number; name: string; overview: string; poster_path: string | null; backdrop_path: string | null; first_air_date: string; vote_average: number; number_of_seasons: number; seasons: { id: number; name: string; season_number: number; episode_count: number }[]; };
type Episode = { id: number; name: string; episode_number: number; overview: string; still_path: string | null; };
type Stream = { url: string; name: string; description: string; playerType: 'custom' | 'abyss'; };

function TVDetailInner({ id }: { id: string }) {
  const [tv, setTv] = useState<TVDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggle, isFavorite } = useFavorites();

  // --- Estados para o Player ---
  const [view, setView] = useState<'initial' | 'server-selection' | 'playing'>('initial');
  const [playerLoading, setPlayerLoading] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // --- Busca Detalhes da Série ---
  useEffect(() => {
    if (!id) return;
    const fetchTVDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR`);
        if (!res.ok) throw new Error("Falha ao buscar os detalhes da série.");
        const data = await res.json();
        setTv(data);
        // Define a primeira temporada válida como padrão
        const firstValidSeason = data.seasons.find((s: any) => s.season_number > 0);
        if (firstValidSeason) {
            setSelectedSeason(firstValidSeason.season_number);
        }
      } catch (err: any) {
        setError(err?.message || "Ocorreu um erro.");
      } finally {
        setLoading(false);
      }
    };
    fetchTVDetails();
  }, [id]);

  // --- Busca Episódios da Temporada Selecionada ---
  useEffect(() => {
    if (!tv) return;
    const fetchSeasonDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        if (!res.ok) throw new Error("Falha ao buscar os episódios.");
        const data = await res.json();
        setEpisodes(data.episodes);
      } catch (err) {
        setEpisodes([]);
      }
    };
    fetchSeasonDetails();
  }, [tv, selectedSeason, id]);

  // --- Função para buscar os links de um episódio ---
  const handleEpisodeClick = async (episode: Episode) => {
    setPlayerLoading(true);
    setPlayerError(null);
    setSelectedEpisode(episode);
    setView('initial'); // Reseta a view
    try {
      const streamRes = await fetch(`/api/stream/series/${id}/${selectedSeason}/${episode.episode_number}`);
      if (!streamRes.ok) throw new Error("Não foi possível obter os links.");
      const streamData = await streamRes.json();
      if (!streamData.streams || streamData.streams.length === 0) {
        throw new Error("Ops! Este episódio está sem link no momento.");
      }
      setStreams(streamData.streams);
      setView('server-selection');
    } catch (err: any) {
      setPlayerError(err.message);
    } finally {
      setPlayerLoading(false);
    }
  };

  const getProxyVideoUrl = (stream: Stream) => {
    const p = new URLSearchParams();
    p.append("videoUrl", stream.url);
    return `/api/video-proxy?${p.toString()}`;
  }

  if (loading) return null; // Pode ser um componente de skeleton aqui
  if (error || !tv) return ( <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24"><p className="text-red-500">{error || "Série não encontrada"}</p></div>)

  const favData: FavoriteItem = { id: tv.id, media_type: "tv", title: tv.name, poster_path: tv.poster_path, backdrop_path: tv.backdrop_path, release_date: tv.first_air_date };
  const fav = isFavorite(tv.id, "tv");

  return (
    <div className="bg-black min-h-screen text-white">
        {/* HERO SECTION - SEM PLAYER */}
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
            <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: tv.backdrop_path ? `url(https://image.tmdb.org/t/p/original/${tv.backdrop_path})` : "none" }} initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="relative z-10 container mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-10">
                 <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter">{tv.name}</h1>
                <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4 text-zinc-300">
                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-zinc-400" /><span>{tv.first_air_date.substring(0, 4)}</span></div>
                    <div className="flex items-center gap-1.5"><Tv size={16} className="text-zinc-400" /><span>{tv.number_of_seasons} Temporada(s)</span></div>
                    <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400" fill="currentColor" /><span>{tv.vote_average.toFixed(1)}</span></div>
                </div>
            </div>
        </div>

        {/* CONTEÚDO PRINCIPAL - PLAYER E EPISÓDIOS */}
        <main className="container mx-auto px-4 md:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna Esquerda: Player */}
                <div className="lg:col-span-2 w-full">
                    <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {view === 'initial' && (
                                <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-zinc-400">
                                    <Play className="w-12 h-12 mx-auto mb-2" />
                                    <p>Selecione um episódio para assistir</p>
                                </motion.div>
                            )}

                            {(playerLoading && view !== 'playing') && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 animate-spin" />
                                </motion.div>
                            )}
                            
                            {playerError && (
                                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-red-400 p-4">
                                    <p>{playerError}</p>
                                </motion.div>
                            )}

                            {view === 'server-selection' && !playerLoading && !playerError && (
                                <motion.div key="servers" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                                    <h3 className="text-lg font-bold mb-4">Selecione um Servidor</h3>
                                    <div className="w-full max-w-xs space-y-2">
                                        {streams.map((stream, index) => (
                                            <Button key={index} onClick={() => { setSelectedStream(stream); setView('playing'); }} className="w-full h-14 bg-zinc-800/60 hover:bg-zinc-700/80 text-white font-semibold flex flex-col items-center justify-center gap-1 text-left p-2">
                                                <div className="flex items-center gap-2">
                                                    {stream.playerType === 'abyss' ? <ShieldAlert className="w-5 h-5 text-yellow-400" /> : <Tv className="w-5 h-5" />}
                                                    <span>{stream.name || 'Servidor'}</span>
                                                </div>
                                                {stream.playerType === 'abyss' && <span className="text-xs font-normal text-yellow-500">(pode conter anúncios)</span>}
                                            </Button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'playing' && selectedStream?.playerType === 'custom' && (
                                <VideoPlayer
                                    key={selectedStream.url}
                                    src={getProxyVideoUrl(selectedStream)}
                                    title={`${tv.name} - S${selectedSeason}E${selectedEpisode?.episode_number}`}
                                    onShowOptions={() => { setView('server-selection'); setSelectedStream(null); }}
                                    mediaType="tv"
                                />
                            )}
                        </AnimatePresence>
                         {view === 'playing' && selectedStream?.playerType === 'abyss' && (
                            <iframe src={selectedStream.url} allowFullScreen className="w-full h-full border-0"></iframe>
                        )}
                    </div>
                </div>

                {/* Coluna Direita: Lista de Episódios */}
                <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Episódios</h2>
                        <Select onValueChange={(value) => setSelectedSeason(Number(value))} defaultValue={String(selectedSeason)}>
                            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                                {tv.seasons.filter((s) => s.season_number > 0 && s.episode_count > 0).map((season) => (<SelectItem key={season.id} value={String(season.season_number)}>{season.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-clean">
                        {episodes.map((ep) => (
                            <button
                                key={ep.id}
                                onClick={() => handleEpisodeClick(ep)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors",
                                    selectedEpisode?.id === ep.id ? "bg-red-600/20" : "bg-zinc-900 hover:bg-zinc-800"
                                )}
                            >
                                <span className="text-zinc-400 font-mono text-lg">{String(ep.episode_number).padStart(2, "0")}</span>
                                <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300/${ep.still_path}` : '/placeholder.jpg'} alt={ep.name} className="w-24 aspect-video object-cover rounded-md bg-zinc-800" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm line-clamp-2">{ep.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}

export default function TVDetailPage({ params }: { params: { id: string } }) {
    return <TVDetailInner id={params.id} />;
}