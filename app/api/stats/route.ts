import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Remove caching to ensure fresh data on every request during debugging
export const revalidate = 0;

export async function GET() {
  try {
    const streamsCollection = collection(firestore, "streams");
    const allStreamsSnapshot = await getDocs(streamsCollection);

    let moviesCount = 0;
    const seriesWithEpisodes = new Set<string>();
    let episodesCount = 0;

    // --- Process Movies ---
    const movieDocs = allStreamsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.media_type === 'movie' && data.url?.includes("short.icu");
    });
    moviesCount = movieDocs.length;

    // --- Process Series ---
    const seriesDocs = allStreamsSnapshot.docs.filter(doc => doc.data().media_type === 'tv');

    // Fetch all episode subcollections in parallel
    const episodePromises = seriesDocs.map(seriesDoc => 
        getDocs(collection(firestore, `streams/${seriesDoc.id}/episodes`))
            .then(episodeSnapshot => ({
                seriesDocId: seriesDoc.id,
                episodeSnapshot
            }))
    );

    const allEpisodeResults = await Promise.all(episodePromises);

    // Process results after all fetches are complete
    for (const { seriesDocId, episodeSnapshot } of allEpisodeResults) {
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