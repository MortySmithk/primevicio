"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, SearchX } from 'lucide-react'
import { MediaCard } from "@/app/page" // Reutilizando o MediaCard da página principal

type MediaItem = {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
  media_type: "movie" | "tv"
}

const API_KEY = "001bbf841bab48f314947688a8230535"
const API_BASE_URL = "https://api.themoviedb.org/3"

export default function SearchPage() {
  const params = useSearchParams()
  const query = params.get("query") || ""
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<MediaItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    async function fetchSearch() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&api_key=${API_KEY}&language=pt-BR&page=1`)
        if (!res.ok) throw new Error("Falha ao buscar resultados.")
        const data = await res.json()
        
        const filteredResults = data.results
          .filter((item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
          .map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            release_date: item.release_date || item.first_air_date || null,
            media_type: item.media_type,
          }))

        setResults(filteredResults)
      } catch (e: any) {
        setError(e?.message || "Ocorreu um erro na busca.")
      } finally {
        setLoading(false)
      }
    }

    fetchSearch()
  }, [query])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-28">
      <main className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Resultados da Busca</h1>
          <p className="text-sm text-zinc-400">Exibindo resultados para: {query ? `"${query}"` : "..."}</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((item) => (
              <MediaCard key={`${item.id}-${item.media_type}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-zinc-500">
            <SearchX className="h-12 w-12" />
            <p className="mt-4">Nenhum resultado encontrado.</p>
          </div>
        )}
      </main>
    </div>
  )
}