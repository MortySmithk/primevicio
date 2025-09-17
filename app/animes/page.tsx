"use client"
// Este arquivo redireciona para a página inicial com o filtro de animes (gênero Animação)
import HomePage from "@/app/page"

// ID de gênero para Animação no TMDB é 16
// Código de idioma para japonês é 'ja'
export default function AnimesPage() {
  return <HomePage defaultMediaType="tv" defaultGenre={16} defaultLanguage="ja" />
}