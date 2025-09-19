"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Heart, Clapperboard, ExternalLink, Copy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { cn } from "@/lib/utils"
import { useFavorites, type FavoriteItem } from "@/components/favorites-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PaginationComponent from "@/components/PaginationComponent"

// --- TIPOS E CONSTANTES ---
export type MediaItem = { id: number; title: string; poster_path: string | null; backdrop_path: string | null; release_date: string | null; media_type: "movie" | "tv"; }
type Genre = { id: number; name: string }
type Category = { title: string; endpoint: string; items: MediaItem[]; page: number; hasMore: boolean }
type Stats = { movies: number; series: number; episodes: number; }

const API_KEY = "001bbf841bab48f314947688a8230535"
const API_BASE_URL = "https://api.themoviedb.org/3"

const initialCategories: Omit<Category, "items" | "page" | "hasMore">[] = [
  { title: "Populares", endpoint: "popular" },
  { title: "Em Alta", endpoint: "top_rated" },
]

// --- COMPONENTES ---
export function MediaCard({ item }: { item: MediaItem }) {
  const { toggle, isFavorite } = useFavorites();
  const { toast } = useToast();
  const fav = isFavorite(item.id, item.media_type);
  const favItem: FavoriteItem = { id: item.id, media_type: item.media_type, title: item.title, poster_path: item.poster_path, backdrop_path: item.backdrop_path, release_date: item.release_date };
  
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: `${label} copiado com sucesso.` });
    } else {
        toast({
            variant: "destructive",
            title: "Cópia não permitida",
            description: "Este recurso funciona apenas em HTTPS ou localhost.",
        });
    }
  };

  const handleOpenEmbed = () => {
    const url = `/embed/${item.media_type}/${item.id}`;
    window.open(url, '_blank');
  };
  
  return (
    <div className="group/card relative">
      <Link href={`/${item.media_type}/${item.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5 shadow-lg shadow-black/30">
          {item.poster_path ? ( <img src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`} alt={`Pôster de ${item.title}`} className="h-full w-full object-cover transition-transform duration-400 ease-out group-hover/card:scale-[1.03]" loading="lazy" /> ) : ( <div className="flex h-full w-full items-center justify-center bg-zinc-800"><Clapperboard className="h-10 w-10 text-zinc-600" /></div> )}
        </div>
      </Link>
      <div className="absolute inset-0 flex flex-col justify-end rounded-lg bg-black/70 p-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">{item.title}</h3>
        <div className="mt-2 space-y-1.5">
            {item.media_type === 'movie' && <button onClick={handleOpenEmbed} className="flex w-full items-center justify-center rounded bg-red-600/80 py-1 text-xs font-semibold text-white hover:bg-red-600">Abrir Embed <ExternalLink className="ml-1.5 h-3 w-3" /></button>}
            <button onClick={() => copyToClipboard(String(item.id), 'TMDb ID')} className="w-full rounded bg-white/10 py-1 text-xs text-white hover:bg-white/20">Copiar TMDb</button>
            <button onClick={() => copyToClipboard(`/${item.media_type}/${item.id}`, 'Link')} className="w-full rounded bg-white/10 py-1 text-xs text-white hover:bg-white/20">Copiar Link</button>
            <button onClick={() => copyToClipboard(item.title, 'Nome')} className="w-full rounded bg-white/10 py-1 text-xs text-white hover:bg-white/20">Copiar Nome</button>
        </div>
      </div>
      <button aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => toggle(favItem)} className={cn("absolute right-2 top-2 z-10 rounded-full p-1.5 backdrop-blur-sm transition-all group-hover/card:opacity-0", fav ? "bg-red-600/50 text-red-300 ring-1 ring-red-400/30" : "bg-black/40 text-white ring-1 ring-white/10")}><Heart className={cn("h-4 w-4", fav && "fill-current")} /></button>
    </div>
  )
}

function CategoryRow({ category, onLoadMore }: { category: Category; onLoadMore: () => void }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: false })
  useEffect(() => { if (inView && category.hasMore) onLoadMore() }, [inView, category.hasMore, onLoadMore])
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-50">{category.title}</h2>
      <div className="relative -mx-4 overflow-x-auto px-4 pb-3 scrollbar-clean">
        <div className="flex gap-4">
          {category.items.map((item) => ( <div key={`${item.id}-${item.media_type}`} className="w-40 shrink-0 sm:w-44 md:w-48"><MediaCard item={item} /></div> ))}
          {category.hasMore && ( <div ref={ref} className="flex h-full w-12 shrink-0 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div> )}
        </div>
      </div>
    </section>
  )
}

function CodeBlock({ code }: { code: string }) {
    const { toast } = useToast();
    const copy = () => { navigator.clipboard.writeText(code); toast({ title: "URL copiada!" }); };
    return (
        <div className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between my-2">
            <pre className="text-sm text-zinc-300 overflow-x-auto scrollbar-clean"><code>{code}</code></pre>
            <Button variant="ghost" size="icon" onClick={copy} className="text-zinc-400 hover:text-white hover:bg-zinc-700"><Copy className="w-4 h-4" /></Button>
        </div>
    );
}

function ApiDocsSection({ stats, loadingStats }: { stats: Stats | null, loadingStats: boolean }) {
    const [showDocs, setShowDocs] = useState(false);
    
    const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);

    return (
        <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 -mt-24">
            <AnimatePresence mode="wait">
                {showDocs ? (
                    <motion.div key="docs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <Button onClick={() => setShowDocs(false)} variant="outline" className="mb-6 bg-transparent border-zinc-700 hover:bg-zinc-800"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
                        <div className="space-y-8 text-zinc-300">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Como Usar os Links de Embed</h3>
                                <p>Nossa plataforma foi projetada para facilitar a integração de conteúdo. Use os links de embed para exibir o player em qualquer site.</p>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">Exemplo para Filmes</h4>
                                <p>Para incorporar um filme, use a URL abaixo substituindo o ID no final pelo TMDb ID do filme desejado.</p>
                                <CodeBlock code="primevicio.vercel.app/embed/movie/755898" />
                            </div>
                             <div>
                                <h4 className="text-xl font-bold text-white mb-1">Exemplo para Séries</h4>
                                <p>Para incorporar um episódio, use a URL no formato: /embed/tv/[ID_DA_SÉRIE]/[TEMPORADA]/[EPISÓDIO]</p>
                                <CodeBlock code="primevicio.vercel.app/embed/tv/119051/1/1" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-extrabold text-white">Incorporação Fácil</h2>
                                <p className="text-zinc-400">Incorpore nosso player no seu site com um simples link. Conteúdo atualizado, design moderno e players sempre funcionais.</p>
                                <Button size="lg" onClick={() => setShowDocs(true)} className="bg-white text-black hover:bg-zinc-200">Aprenda como usar</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                {loadingStats ? Array.from({length: 3}).map((_, i) => <Card key={i} className="bg-zinc-900/80 border-zinc-800"><CardHeader><div className="h-7 w-20 bg-zinc-800 rounded-md mx-auto animate-pulse" /></CardHeader><CardContent><div className="h-4 w-16 bg-zinc-800 rounded-md mx-auto animate-pulse" /></CardContent></Card>) : (
                                    <>
                                        <Card className="bg-zinc-900/80 border-zinc-800"><CardHeader><CardTitle className="text-2xl text-white">{formatNumber(stats?.movies || 0)}</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-400">Filmes</p></CardContent></Card>
                                        <Card className="bg-zinc-900/80 border-zinc-800"><CardHeader><CardTitle className="text-2xl text-white">{formatNumber(stats?.series || 0)}</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-400">Séries</p></CardContent></Card>
                                        <Card className="bg-zinc-900/80 border-zinc-800 col-span-2"><CardHeader><CardTitle className="text-2xl text-white">{formatNumber(stats?.episodes || 0)}</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-400">Episódios</p></CardContent></Card>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

function HomeInner({ 
    defaultMediaType = "movie", 
    defaultGenre, 
    defaultOriginCountry, 
    defaultLanguage,
    usePagination = false
}: { 
    defaultMediaType?: "movie" | "tv"; 
    defaultGenre?: number; 
    defaultOriginCountry?: string;
    defaultLanguage?: string;
    usePagination?: boolean;
}) {
  const [mediaType, setMediaType] = useState<"movie" | "tv">(defaultMediaType)
  const [categories, setCategories] = useState<Category[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | null>(defaultGenre || null)
  const [genreResults, setGenreResults] = useState<MediaItem[]>([])
  const [genrePage, setGenrePage] = useState(1)
  const [hasMoreGenreResults, setHasMoreGenreResults] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [heroBackdrop, setHeroBackdrop] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const { ref: genreLoadMoreRef, inView: genreLoadMoreInView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Falha ao buscar estatísticas", error);
        } finally {
            setLoadingStats(false);
        }
    };
    fetchStats();
  }, []);

  const fetchFromAPI = useCallback(async (endpoint: string, page: number) => { 
    const url = `${API_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=pt-BR&page=${page}`;
    const res = await fetch(url); 
    if (!res.ok) throw new Error("A resposta da rede não foi bem-sucedida."); 
    return res.json(); 
  }, []);

  const mapResults = useCallback((results: any[], type: "movie" | "tv"): MediaItem[] => results.map((item: any) => ({ id: item.id, title: item.title || item.name, poster_path: item.poster_path, backdrop_path: item.backdrop_path, release_date: item.release_date || item.first_air_date || null, media_type: type, })),[]);

  const fetchCategoryData = useCallback(async (categoryIndex: number, type: "movie" | "tv", page: number) => { 
    const cat = categories[categoryIndex]; 
    if (!cat || !cat.hasMore || loadingMore) return; 
    setLoadingMore(true); 
    try { 
      const data = await fetchFromAPI(`/${type}/${cat.endpoint}`, page); 
      const newItems = mapResults(data.results, type); 
      setCategories((prev) => prev.map((c, idx) => idx === categoryIndex ? { ...c, items: [...c.items, ...newItems], page: c.page + 1, hasMore: data.page < data.total_pages } : c)); 
    } finally { 
      setLoadingMore(false); 
    } 
  }, [categories, loadingMore, fetchFromAPI, mapResults]);

  const fetchByGenre = useCallback(async (
    genreId: number | null, 
    type: "movie" | "tv", 
    page: number, 
    isInitial = false,
    originCountry: string | null = null,
    language: string | null = null
) => {
    setLoadingMore(true);
    let endpoint = `/discover/${type}?`;
    if (genreId !== null) {
      endpoint += `with_genres=${genreId}&`;
    }
    if (originCountry !== null) {
      endpoint += `with_origin_country=${originCountry}&`;
    }
    if (language !== null) {
      endpoint += `with_original_language=${language}&`;
    }

    try {
        const data = await fetchFromAPI(endpoint, page);
        const newItems = mapResults(data.results, type);
        setGenreResults(isInitial ? newItems : (prev) => [...prev, ...newItems]);
        setHasMoreGenreResults(data.page < data.total_pages);
        setGenrePage(page); // Corrigido para definir a página atual
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages);
        if (isInitial) setHeroBackdrop(newItems[0]?.backdrop_path ?? null);
    } catch (error) {
        console.error("Erro ao buscar por gênero:", error)
    } finally {
        setLoadingMore(false);
    }
}, [fetchFromAPI, mapResults]); // Removido 'loadingMore' da dependência

  const initializeData = useCallback(async (
    type: "movie" | "tv", 
    genreId: number | null,
    originCountry: string | null = null,
    language: string | null = null
) => { 
    setLoading(true); 
    setGenreResults([]); 
    setCategories([]); 
    setHasMoreGenreResults(true); 
    setGenrePage(1); 
    
    const genresData = await fetchFromAPI(`/genre/${type}/list?`, 1); 
    setGenres(genresData.genres); 
    
    if (genreId !== null || originCountry !== null || language !== null) { 
        await fetchByGenre(genreId, type, 1, true, originCountry, language); 
    } else { 
        const newCategories: Category[] = initialCategories.map((cat) => ({ ...cat, items: [], page: 1, hasMore: true })); 
        const categoryPromises = newCategories.map((cat) => fetchFromAPI(`/${type}/${cat.endpoint}`, 1)); 
        const categoryResults = await Promise.all(categoryPromises); 
        categoryResults.forEach((data, index) => { 
            newCategories[index].items = mapResults(data.results, type); 
            newCategories[index].page = 2; 
            newCategories[index].hasMore = data.page < data.total_pages; 
        }); 
        setCategories(newCategories); 
        const firstBackdrop = newCategories[0]?.items?.[0]?.backdrop_path; 
        setHeroBackdrop(firstBackdrop ?? null); 
    } 
    setLoading(false); 
}, [fetchFromAPI, mapResults, fetchByGenre]);

  useEffect(() => { 
    setMediaType(defaultMediaType); 
    setSelectedGenre(defaultGenre || null); 
    initializeData(defaultMediaType, defaultGenre || null, defaultOriginCountry, defaultLanguage); 
  }, [defaultMediaType, defaultGenre, defaultOriginCountry, defaultLanguage, initializeData]);

  useEffect(() => { 
    if (!usePagination && genreLoadMoreInView && hasMoreGenreResults && (selectedGenre !== null || defaultOriginCountry || defaultLanguage) && !loading && !loadingMore) { 
      fetchByGenre(selectedGenre, mediaType, genrePage + 1, false, defaultOriginCountry, defaultLanguage); 
    } 
  }, [genreLoadMoreInView, hasMoreGenreResults, selectedGenre, mediaType, genrePage, fetchByGenre, loading, defaultOriginCountry, defaultLanguage, usePagination, loadingMore]);

  const handleGenreSelect = (genreId: number | null) => { 
    if (genreId === selectedGenre) return; 
    setSelectedGenre(genreId); 
    initializeData(mediaType, genreId); 
  }

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0); // Rola para o topo
    fetchByGenre(selectedGenre, mediaType, page, true, defaultOriginCountry, defaultLanguage);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative flex h-[55vh] items-center justify-center overflow-hidden pt-24">
        <AnimatePresence>
          {heroBackdrop && ( <motion.div key={heroBackdrop} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.6 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original/${heroBackdrop})` }} /> )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
      </section>

      <ApiDocsSection stats={stats} loadingStats={loadingStats} />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => handleGenreSelect(null)} className={cn("rounded-md border border-white/15 px-3 py-1 text-sm transition-colors", selectedGenre === null ? "bg-white text-black" : "bg-white/5 text-zinc-100 hover:bg-white/10")}>Todos</button>
          {genres.map((g) => ( <button key={g.id} onClick={() => handleGenreSelect(g.id)} className={cn("rounded-md border border-white/15 px-3 py-1 text-sm transition-colors", selectedGenre === g.id ? "bg-white text-black" : "bg-white/5 text-zinc-100 hover:bg-white/10")}>{g.name}</button>))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selectedGenre === null ? "categories" : `genre-${selectedGenre}-${mediaType}-${defaultOriginCountry}-${defaultLanguage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {loading ? ( <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-zinc-500" /></div> ) : selectedGenre === null && !defaultOriginCountry && !defaultLanguage ? ( categories.map((cat, index) => (<CategoryRow key={cat.endpoint} category={cat} onLoadMore={() => fetchCategoryData(index, mediaType, cat.page)} />)) ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {genreResults.map((item) => (<MediaCard key={`${item.id}-genre`} item={item} />))}
                </div>
                {usePagination && totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <PaginationComponent currentPage={genrePage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>
                )}
                {!usePagination && hasMoreGenreResults && ( <div ref={genreLoadMoreRef} className="flex h-28 items-center justify-center">{loadingMore && <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />}</div> )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  )
}

export default function HomePage({ defaultMediaType = "movie", defaultGenre, defaultOriginCountry, defaultLanguage, usePagination }: { defaultMediaType?: "movie" | "tv"; defaultGenre?: number; defaultOriginCountry?: string; defaultLanguage?: string; usePagination?: boolean }) {
  return ( 
    <HomeInner 
      key={`${defaultMediaType}-${defaultGenre || 'all'}-${defaultOriginCountry || 'all'}-${defaultLanguage || 'all'}`} 
      defaultMediaType={defaultMediaType} 
      defaultGenre={defaultGenre} 
      defaultOriginCountry={defaultOriginCountry}
      defaultLanguage={defaultLanguage}
      usePagination={usePagination}
    /> 
  )
}