"use client"
// Este arquivo redireciona para a página inicial com o filtro de doramas (gênero Drama)
import HomePage from "@/app/page"

// O ID de gênero para Drama no TMDB é 18
// O código de país para Coreia do Sul é 'KR'
export default function DoramasPage() {
  return <HomePage defaultMediaType="tv" defaultOriginCountry="KR" />
}