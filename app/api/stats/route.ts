import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://ultraembed.fun/api/stats", {
      next: { revalidate: 3600 } // Cache de 1 hora
    });

    if (!response.ok) {
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
    return NextResponse.json({
        movies: 0,
        series: 0,
        episodes: 0,
      },
      { status: 500 }
    );
  }
}