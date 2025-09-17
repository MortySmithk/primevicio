"use client"
// Este arquivo redireciona para a página inicial com o filtro de filmes
import HomePage from "@/app/page"
export default function FilmesPage() {
  return <HomePage defaultMediaType="movie" usePagination={true} />
}