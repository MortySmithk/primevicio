"use client"
// Este arquivo redireciona para a página inicial com o filtro de animes (gênero Animação)
import HomePage from "@/app/page"
export default function AnimesPage() {
  // O ID de gênero para Animação no TMDB é 16
  return <HomePage defaultMediaType="tv" defaultGenre={16} />
}