import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

async function getFromFirestore(tmdbId: string, season: string, episode: string) {
    try {
        const docRef = doc(firestore, "media", tmdbId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const seriesData = docSnap.data();
            const seasonData = seriesData.seasons?.[season];
            const episodeData = seasonData?.episodes?.find(
                (ep: any) => ep.episode_number == parseInt(episode)
            );

            if (episodeData?.urls && episodeData.urls.length > 0) {
                // Filtra para usar apenas links .mp4 e que não são da superflix
                const validStreams = episodeData.urls
                    .filter((data: any) => data.url && data.url.endsWith('.mp4') && !data.url.includes('superflixapi.shop'))
                    .map((data: any) => ({
                        url: data.url,
                        name: "Servidor Principal",
                        description: `Qualidade ${data.quality || 'HD'}`
                    }));
                
                if (validStreams.length > 0) {
                    console.log(`[Firestore] Links válidos encontrados para S${season}E${episode} da série ${tmdbId}`);
                    return validStreams;
                }
            }
        }
        console.log(`[Firestore] Nenhum link válido (.mp4) encontrado para S${season}E${episode} da série ${tmdbId}`);
        return null;
    } catch (error) {
        console.error("[Firestore] Erro ao buscar série:", error);
        return null;
    }
}

export async function GET(request: Request, { params }: { params: { params: string[] } }) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }
  
  const firestoreStreams = await getFromFirestore(tmdbId, season, episode);

  if (firestoreStreams && firestoreStreams.length > 0) {
    return NextResponse.json({ streams: firestoreStreams });
  }
  
  return NextResponse.json({ streams: [] });
}