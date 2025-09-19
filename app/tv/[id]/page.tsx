"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Calendar, Tv, Heart, PlayCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button, buttonVariants } from "@/components/ui/button"
import { useFavorites, type FavoriteItem } from "@/components/favorites-context"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const API_KEY = "001bbf841bab48f314947688a8230535"
const API_BASE_URL = "https://api.themoviedb.org/3";

// --- TIPOS ---
type TVDetails = { id: number; name: string; overview: string; poster_path: string | null; backdrop_path: string | null; first_air_date: string; vote_average: number; number_of_seasons: number; seasons: { id: number; name: string; season_number: number; episode_count: number }[]; };
type Episode = { id: number; name: string; episode_number: number; overview: string; still_path: string | null; };

function TVDetailInner({ id }: { id: string }) {
  const [tv, setTv] = useState<TVDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggle, isFavorite } = useFavorites();
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>("");

  // --- Busca Detalhes da Série ---
  useEffect(() => {
    if (!id) return;
    const fetchTVDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=seasons`);
        if (!res.ok) throw new Error("Falha ao buscar os detalhes da série.");
        const data = await res.json();
        setTv(data);
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
        // Define o primeiro episódio da lista como padrão e atualiza o iframe
        if (data.episodes.length > 0) {
            const firstEpisode = data.episodes[0];
            setSelectedEpisode(firstEpisode);
            setIframeUrl(`https://ultraembed.fun/serie/${id}/${selectedSeason}/${firstEpisode.episode_number}`);
        } else {
            setIframeUrl(""); // Limpa o iframe se não houver episódios
        }
      } catch (err) {
        setEpisodes([]);
        setIframeUrl("");
      }
    };
    fetchSeasonDetails();
  }, [tv, selectedSeason, id]);

  const handleEpisodeClick = (ep: Episode) => {
    setSelectedEpisode(ep);
    setIframeUrl(`https://ultraembed.fun/serie/${id}/${selectedSeason}/${ep.episode_number}`);
  };
  
  if (loading) return null;
  if (error || !tv) return ( <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24"><p className="text-red-500">{error || "Série não encontrada"}</p></div>)

  const favData: FavoriteItem = { id: tv.id, media_type: "tv", title: tv.name, poster_path: tv.poster_path, backdrop_path: tv.backdrop_path, release_date: tv.first_air_date };
  const fav = isFavorite(tv.id, "tv");

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
        <div className="relative w-full h-[56.25vw] max-h-[80vh] bg-black">
          {iframeUrl ? (
              <iframe
                  key={iframeUrl}
                  src={iframeUrl}
                  allowFullScreen
                  className="w-full h-full border-0"
              ></iframe>
          ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <Loader2 className="w-12 h-12 animate-spin text-zinc-600"/>
              </div>
          )}
        </div>

        <main className="container mx-auto px-4 md:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Detalhes */}
                <div className="lg:col-span-1">
                     <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{tv.name}</h1>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3 text-zinc-400 text-sm">
                        <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400" fill="currentColor" /><span>{tv.vote_average.toFixed(1)}</span></div>
                        <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{tv.first_air_date.substring(0, 4)}</span></div>
                        <div className="flex items-center gap-1.5"><Tv size={14} /><span>{tv.number_of_seasons} Temporada(s)</span></div>
                    </div>
                    <p className="text-zinc-400 mt-4 text-sm">{tv.overview}</p>
                    <Button onClick={() => toggle(favData)} variant="outline" className={cn("rounded-md w-full mt-4", fav ? "bg-red-600/20 border-red-500/30 text-red-300" : "border-white/20 bg-white/5 text-white")}>
                        <Heart className={cn("mr-2 h-4 w-4", fav && "fill-current")} />
                        {fav ? "Favorito" : "Favoritar"}
                    </Button>
                </div>
                {/* Coluna Direita: Lista de Episódios */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Episódios</h2>
                        <Select onValueChange={(value) => setSelectedSeason(Number(value))} defaultValue={String(selectedSeason)}>
                            <SelectTrigger className="w-[220px] bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
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
                                <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300/${ep.still_path}` : '/placeholder.jpg'} alt={ep.name} className="w-28 aspect-video object-cover rounded-md bg-zinc-800" />
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