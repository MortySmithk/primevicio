import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://ultraembed.fun/api/stats", {
      headers: {
        // Adicionado para simular uma requisição de navegador
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache de 1 hora
    });

    if (!response.ok) {
      console.error(`Erro na API de stats: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats = await response.json();

    return NextResponse.json({
      movies: stats.movies || 0,
      series: stats.series || 0,
      episodes: stats.episodes || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas da ultraembed.fun:", error);
    // Retorna zero em caso de falha para não quebrar a página
    return NextResponse.json({
        movies: 0,
        series: 0,
        episodes: 0,
      },
      { status: 500 }
    );
  }
}