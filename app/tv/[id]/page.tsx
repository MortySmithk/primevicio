"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Calendar, Tv, Heart, Play } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useFavorites, type FavoriteItem } from "@/components/favorites-context"
import { cn } from "@/lib/utils"

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


  if (loading) return null; // Pode ser um componente de skeleton aqui
  if (error || !tv) return ( <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24"><p className="text-red-500">{error || "Série não encontrada"}</p></div>)

  const favData: FavoriteItem = { id: tv.id, media_type: "tv", title: tv.name, poster_path: tv.poster_path, backdrop_path: tv.backdrop_path, release_date: tv.first_air_date };
  const fav = isFavorite(tv.id, "tv");

  const episodeLink = selectedEpisode
  ? `/embed/tv/${tv.id}/${selectedSeason}/${selectedEpisode.episode_number}`
  : episodes.length > 0
    ? `/embed/tv/${tv.id}/${selectedSeason}/${episodes[0].episode_number}`
    : "#";

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
                 <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={episodeLink} target="_blank" className={cn(buttonVariants({ size: "default" }), "bg-red-600 text-white hover:bg-red-600/90")}>
                        <PlayCircle className="mr-2 h-5 w-5" />Assistir agora
                    </Link>
                    <Button onClick={() => toggle(favData)} variant="outline" className={cn("rounded-md", fav ? "bg-red-600/20 border-red-500/30 text-red-300" : "border-white/20 bg-white/5 text-white")}>
                        <Heart className={cn("mr-2 h-4 w-4", fav && "fill-current")} />
                        {fav ? "Favorito" : "Favoritar"}
                    </Button>
                </div>
            </div>
        </div>

        {/* CONTEÚDO PRINCIPAL - PLAYER E EPISÓDIOS */}
        <main className="container mx-auto px-4 md:px-8 py-8">
            <div className="grid grid-cols-1">
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
                            <Link
                                key={ep.id}
                                href={`/embed/tv/${tv.id}/${selectedSeason}/${ep.episode_number}`}
                                target="_blank"
                                onClick={() => setSelectedEpisode(ep)}
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
                            </Link>
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