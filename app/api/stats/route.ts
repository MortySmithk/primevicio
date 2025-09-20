import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const revalidate = 60; // Cache the result for 60 seconds

export async function GET() {
  try {
    const streamsCollection = collection(firestore, "streams");

    // --- Contagem de Filmes ---
    const moviesQuery = query(
      streamsCollection,
      where("media_type", "==", "movie"),
      where("url", ">=", "https://short.icu"),
      where("url", "<=", "https://short.icu" + '\uf8ff')
    );
    const moviesSnapshot = await getDocs(moviesQuery);
    // Double-check filter in code as Firestore `where` can be tricky with substrings
    const moviesCount = moviesSnapshot.docs.filter(doc => doc.data().url?.includes("short.icu")).length;

    // --- Contagem de Séries e Episódios (Otimizado) ---
    const seriesQuery = query(streamsCollection, where("media_type", "==", "tv"));
    const seriesSnapshot = await getDocs(seriesQuery);

    let episodesCount = 0;
    const seriesWithEpisodes = new Set<string>();

    // Create a batch of promises to fetch all episode subcollections in parallel
    const episodePromises = seriesSnapshot.docs.map(seriesDoc => {
      const episodesCollection = collection(firestore, `streams/${seriesDoc.id}/episodes`);
      // Query only for documents that have the 'url' field to narrow down results
      const episodesQuery = query(episodesCollection, where("url", ">=", ""));
      return getDocs(episodesQuery).then(episodeSnapshot => ({
        seriesDocId: seriesDoc.id,
        episodeSnapshot
      }));
    });
    
    const allEpisodeResults = await Promise.all(episodePromises);

    // Process the results after all promises have resolved
    for (const { seriesDocId, episodeSnapshot } of allEpisodeResults) {
      const validEpisodes = episodeSnapshot.docs.filter(doc => doc.data().url?.includes("short.icu"));
      if (validEpisodes.length > 0) {
        seriesWithEpisodes.add(seriesDocId);
        episodesCount += validEpisodes.length;
      }
    }

    return NextResponse.json({
      movies: moviesCount,
      series: seriesWithEpisodes.size,
      episodes: episodesCount,
    });
    
  } catch (error) {
    console.error("Error fetching stats:", error);
    // Return stale or zeroed data on error to prevent breaking the frontend
    return NextResponse.json({ 
        movies: 0, 
        series: 0, 
        episodes: 0, 
        error: "Failed to fetch stats" 
    }, { status: 500 });
  }
}