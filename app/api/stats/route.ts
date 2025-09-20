import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Remove o cache para garantir dados atualizados a cada requisição
export const revalidate = 0;

export async function GET() {
  try {
    // CORREÇÃO: Alterado de "streams" para "media"
    const mediaCollection = collection(firestore, "media");
    const allMediaSnapshot = await getDocs(mediaCollection);

    let moviesCount = 0;
    const seriesWithEpisodes = new Set<string>();
    let episodesCount = 0;

    // --- Processa Filmes ---
    const movieDocs = allMediaSnapshot.docs.filter(doc => {
        const data = doc.data();
        // Filtra para contar apenas filmes com URL do short.icu
        return data.media_type === 'movie' && data.url?.includes("short.icu");
    });
    moviesCount = movieDocs.length;

    // --- Processa Séries ---
    const seriesDocs = allMediaSnapshot.docs.filter(doc => doc.data().media_type === 'tv');

    // Busca todas as subcoleções de episódios em paralelo
    const episodePromises = seriesDocs.map(seriesDoc => 
        // CORREÇÃO: Alterado de `streams/${seriesDoc.id}/episodes` para `media/${seriesDoc.id}/episodes`
        getDocs(collection(firestore, `media/${seriesDoc.id}/episodes`))
            .then(episodeSnapshot => ({
                seriesDocId: seriesDoc.id,
                episodeSnapshot
            }))
    );

    const allEpisodeResults = await Promise.all(episodePromises);

    // Processa os resultados após todas as buscas terminarem
    for (const { seriesDocId, episodeSnapshot } of allEpisodeResults) {
        // Filtra para contar apenas episódios com URL do short.icu
        const abyssEpisodes = episodeSnapshot.docs.filter(doc => doc.data().url?.includes("short.icu"));
        
        if (abyssEpisodes.length > 0) {
            seriesWithEpisodes.add(seriesDocId);
            episodesCount += abyssEpisodes.length;
        }
    }

    return NextResponse.json({
      movies: moviesCount,
      series: seriesWithEpisodes.size,
      episodes: episodesCount,
    });
    
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ 
        movies: 0, 
        series: 0, 
        episodes: 0, 
        error: "Failed to fetch stats" 
    }, { status: 500 });
  }
}

