// app/api/stream/series/[...params]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export async function GET(request: Request, { params }: { params: { params: string[] } }) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  try {
    const docRef = doc(firestore, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const seasonData = data.seasons?.[season];
      const episodeData = seasonData?.episodes?.find(
        (ep: any) => ep.episode_number == parseInt(episode)
      );

      if (episodeData && episodeData.urls && episodeData.urls.length > 0) {
        const abyssStream = episodeData.urls.find((u: any) => u.url?.includes("short.icu"));
        if (abyssStream) {
          const stream = {
            playerType: 'abyss',
            url: abyssStream.url,
            name: abyssStream.quality || `T${season} E${episode}`
          };
          return NextResponse.json({ streams: [stream] });
        }
      }
    }
    
    return NextResponse.json({ streams: [] });

  } catch (error) {
    console.error(`Erro ao buscar streams para a série ${tmdbId} S${season}E${episode}:`, error);
    return NextResponse.json({ error: "Falha ao buscar streams" }, { status: 500 });
  }
}