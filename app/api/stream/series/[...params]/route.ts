import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { params: string[] } }) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  try {
    // FIX: Treat tmdbId as a string for the query.
    const seriesQuery = query(
        collection(firestore, "streams"), 
        where("tmdbId", "==", tmdbId), // No longer converting to number
        where("media_type", "==", "tv")
    );
    const seriesSnapshot = await getDocs(seriesQuery);

    if (seriesSnapshot.empty) {
      console.log(`[API/SERIES] No stream document found for tmdbId: ${tmdbId}`);
      return NextResponse.json({ streams: [] });
    }
    const seriesDocId = seriesSnapshot.docs[0].id;

    const episodeQuery = query(
      collection(firestore, `streams/${seriesDocId}/episodes`),
      where("season", "==", parseInt(season)),
      where("episode", "==", parseInt(episode))
    );
    const episodeSnapshot = await getDocs(episodeQuery);

    if (episodeSnapshot.empty) {
        return NextResponse.json({ streams: [] });
    }

    const streams = episodeSnapshot.docs
      .map(doc => doc.data())
      .filter(stream => stream.url && stream.url.includes("short.icu"));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error(`Error fetching streams for series ${tmdbId} S${season}E${episode}:`, error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}