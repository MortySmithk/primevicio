"use client"
// Este arquivo redireciona para a página inicial com o filtro de séries
import HomePage from "@/app/page"
export default function SeriesPage() {
  return <HomePage defaultMediaType="tv" usePagination={true} />
}