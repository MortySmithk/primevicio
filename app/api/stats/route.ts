// app/api/stats/route.ts
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Remove o cache para garantir dados atualizados a cada requisição
export const revalidate = 0;
const PLAYER_DOMAIN = "short.icu";

// Função para verificar se um item de mídia tem um link válido
const hasValidLink = (data: any): boolean => {
  if (!data) return false;

  // Para filmes
  if (data.type === 'movie' && Array.isArray(data.urls)) {
    return data.urls.some(u => u?.url?.includes(PLAYER_DOMAIN));
  }
  
  // Para séries
  if (data.type === 'series' && data.seasons) {
    return Object.values(data.seasons).some((season: any) => 
      Array.isArray(season.episodes) && season.episodes.some((ep: any) =>
        Array.isArray(ep.urls) && ep.urls.some((u: any) => u?.url?.includes(PLAYER_DOMAIN))
      )
    );
  }
  
  return false;
};

// Função para contar episódios em uma série
const countEpisodesWithLinks = (data: any): number => {
  if (data.type !== 'series' || !data.seasons) {
    return 0;
  }
  
  let episodeCount = 0;
  for (const seasonKey in data.seasons) {
    const season = data.seasons[seasonKey];
    if (Array.isArray(season.episodes)) {
      for (const episode of season.episodes) {
        if (Array.isArray(episode.urls) && episode.urls.some((u: any) => u?.url?.includes(PLAYER_DOMAIN))) {
          episodeCount++;
        }
      }
    }
  }
  return episodeCount;
};


export async function GET() {
  try {
    const mediaCollection = collection(firestore, "media");
    const allMediaSnapshot = await getDocs(mediaCollection);

    let moviesCount = 0;
    let seriesCount = 0;
    let episodesCount = 0;

    allMediaSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.type === 'movie' && hasValidLink(data)) {
        moviesCount++;
      } else if (data.type === 'series' && hasValidLink(data)) {
        seriesCount++;
        episodesCount += countEpisodesWithLinks(data);
      }
    });

    return NextResponse.json({
      movies: moviesCount,
      series: seriesCount,
      episodes: episodesCount,
    });
    
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ 
        movies: 0, 
        series: 0, 
        episodes: 0, 
        error: "Falha ao buscar estatísticas" 
    }, { status: 500 });
  }
}