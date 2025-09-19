import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { params: string[] } }) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  try {
    const episodeQuery = query(
      collection(db, `streams/${tmdbId}/episodes`),
      where("season", "==", parseInt(season)),
      where("episode", "==", parseInt(episode)),
      where("playerType", "==", "abyss")
    );
    const episodeSnapshot = await getDocs(episodeQuery);

    if (episodeSnapshot.empty) {
        return NextResponse.json({ streams: [] });
    }

    const streams = episodeSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ streams });
  } catch (error) {
    console.error(`Error fetching streams for series ${tmdbId} S${season}E${episode}:`, error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}