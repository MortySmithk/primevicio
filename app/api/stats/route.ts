import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Remove o cache para garantir dados atualizados a cada requisição
export const revalidate = 0;

export async function GET() {
  try {
    const streamsCollection = collection(firestore, "streams");
    const allStreamsSnapshot = await getDocs(streamsCollection);

    let moviesCount = 0;
    const seriesWithEpisodes = new Set<string>();
    let episodesCount = 0;

    // --- Processa Filmes ---
    const movieDocs = allStreamsSnapshot.docs.filter(doc => {
        const data = doc.data();
        // ATENÇÃO: O filtro 'short.icu' foi removido para fins de depuração.
        // Se os contadores funcionarem agora, significa que os dados no Firestore
        // não correspondem ao filtro 'data.url?.includes("short.icu")'.
        // Para reativar o filtro, remova o comentário da linha abaixo e apague a seguinte.
        // return data.media_type === 'movie' && data.url?.includes("short.icu");
        return data.media_type === 'movie';
    });
    moviesCount = movieDocs.length;

    // --- Processa Séries ---
    const seriesDocs = allStreamsSnapshot.docs.filter(doc => doc.data().media_type === 'tv');

    // Busca todas as subcoleções de episódios em paralelo
    const episodePromises = seriesDocs.map(seriesDoc => 
        getDocs(collection(firestore, `streams/${seriesDoc.id}/episodes`))
            .then(episodeSnapshot => ({
                seriesDocId: seriesDoc.id,
                episodeSnapshot
            }))
    );

    const allEpisodeResults = await Promise.all(episodePromises);

    // Processa os resultados após todas as buscas terminarem
    for (const { seriesDocId, episodeSnapshot } of allEpisodeResults) {
        // ATENÇÃO: O filtro 'short.icu' foi removido para fins de depuração.
        // Se os contadores funcionarem agora, significa que os dados no Firestore
        // não correspondem ao filtro 'doc.data().url?.includes("short.icu")'.
        // Para reativar o filtro, remova o comentário da linha abaixo e apague a seguinte.
        // const abyssEpisodes = episodeSnapshot.docs.filter(doc => doc.data().url?.includes("short.icu"));
        const abyssEpisodes = episodeSnapshot.docs;
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