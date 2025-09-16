"use client"
// Este arquivo redireciona para a página inicial com o filtro de doramas (gênero Drama)
import HomePage from "@/app/page"
export default function DoramasPage() {
  // O ID de gênero para Drama no TMDB é 18
  return <HomePage defaultMediaType="tv" defaultGenre={18} />
}