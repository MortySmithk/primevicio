"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Calendar, PlayCircle, ChevronDown, Loader2, Tv, Heart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useFavorites, type FavoriteItem } from "@/components/favorites-context"
import { cn } from "@/lib/utils"

const API_KEY = "001bbf841bab48f314947688a8230535"

type TVDetails = { id: number; name: string; overview: string; poster_path: string | null; backdrop_path: string | null; first_air_date: string; vote_average: number; number_of_seasons: number; seasons: { id: number; name: string; season_number: number; episode_count: number }[]; };
type SeasonDetails = { episodes: Episode[] };
type Episode = { id: number; name: string; episode_number: number; overview: string; still_path: string | null; };

const API_BASE_URL = "https://api.themoviedb.org/3";

function TVDetailInner({ id }: { id: string }) {
  const [tv, setTv] = useState<TVDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggle, isFavorite } = useFavorites();

  useEffect(() => {
    if (!id) return;
    const fetchTVDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits`);
        if (!res.ok) throw new Error("Falha ao buscar os detalhes da série.");
        const data = await res.json();
        setTv(data);
      } catch (err: any) {
        setError(err?.message || "Ocorreu um erro.");
      } finally {
        setLoading(false);
      }
    };
    fetchTVDetails();
  }, [id]);

  useEffect(() => {
    if (!tv) return;
    const fetchSeasonDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        if (!res.ok) throw new Error("Falha ao buscar os episódios.");
        const data: SeasonDetails = await res.json();
        setEpisodes(data.episodes);
      } catch (err) {
        setEpisodes([]);
      }
    };
    fetchSeasonDetails();
  }, [tv, selectedSeason, id]);


  if (loading) return null;
  if (error) return ( <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24"><p className="text-red-500">{error}</p></div>)
  if (!tv) return null;

  const favData: FavoriteItem = { id: tv.id, media_type: "tv", title: tv.name, poster_path: tv.poster_path, backdrop_path: tv.backdrop_path, release_date: tv.first_air_date };
  const fav = isFavorite(tv.id, "tv");

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: tv.backdrop_path ? `url(https://image.tmdb.org/t/p/original/${tv.backdrop_path})` : "none" }} initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <main className="container mx-auto px-4 md:px-8 pb-24 -mt-48 md:-mt-64 relative z-10">
        <section className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="flex-shrink-0 w-60 md:w-72 mx-auto md:mx-0">
            <img src={`https://image.tmdb.org/t/p/w500/${tv.poster_path}`} alt={`Pôster de ${tv.name}`} className="rounded-lg shadow-2xl shadow-black/50 w-full" />
          </div>
          <div className="flex-grow pt-0 md:pt-20 text-center md:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter">{tv.name}</h1>
            <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-6 gap-y-2 mt-4 text-zinc-300">
              <div className="flex items-center gap-1.5"><Calendar size={16} className="text-zinc-400" /><span>{tv.first_air_date.substring(0, 4)}</span></div>
              <div className="flex items-center gap-1.5"><Tv size={16} className="text-zinc-400" /><span>{tv.number_of_seasons} Temporada(s)</span></div>
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400" fill="currentColor" /><span>{tv.vote_average.toFixed(1)}</span></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
                <Button onClick={() => toggle(favData)} variant="outline" className={cn("rounded-md", fav ? "bg-red-600/20 border-red-500/30 text-red-300" : "border-white/20 bg-white/5 text-white")}><Heart className={cn("mr-2 h-4 w-4", fav && "fill-current")} />{fav ? "Favorito" : "Favoritar"}</Button>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-2 text-zinc-200">Sinopse</h2>
              <p className="text-zinc-400 leading-relaxed max-w-2xl mx-auto md:mx-0">{tv.overview || "Sinopse não disponível."}</p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div><h2 className="text-3xl font-bold mb-1">Episódios</h2><p className="text-zinc-400">Selecione uma temporada para ver os episódios.</p></div>
            <Select onValueChange={(value) => setSelectedSeason(Number(value))} defaultValue={String(selectedSeason)}>
              <SelectTrigger className="w-full sm:w-[280px] bg-zinc-900/80 border-zinc-700 mt-4 sm:mt-0"><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                {tv.seasons.filter((s) => s.season_number > 0 && s.episode_count > 0).map((season) => (<SelectItem key={season.id} value={String(season.season_number)}>{season.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {episodes.map((ep) => (
              <div key={ep.id} className="bg-zinc-900/70 backdrop-blur-sm rounded-lg overflow-hidden transition-all">
                <Link href={`/embed/tv/${id}/${selectedSeason}/${ep.episode_number}`} target="_blank">
                    <div className="w-full p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 transition-colors text-left">
                      <div className="flex items-center gap-4"><span className="text-zinc-400 font-mono text-sm w-8 text-center">{String(ep.episode_number).padStart(2, "0")}</span><span className="font-semibold">{ep.name}</span></div>
                      <PlayCircle className="w-5 h-5 text-zinc-400" />
                    </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default function TVDetailPage({ params }: { params: { id: string } }) {
    return <TVDetailInner id={params.id} />;
}