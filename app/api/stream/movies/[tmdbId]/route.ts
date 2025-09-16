import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

async function getFromFirestore(tmdbId: string) {
    try {
        const docRef = doc(firestore, "media", tmdbId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const movieData = docSnap.data();
            if (movieData.urls && movieData.urls.length > 0) {
                // Filtra para usar apenas links .mp4 e que não são da superflix
                const validStreams = movieData.urls
                    .filter((data: any) => data.url && data.url.endsWith('.mp4') && !data.url.includes('superflixapi.shop'))
                    .map((data: any) => ({
                        url: data.url,
                        name: "Servidor Principal",
                        description: `Qualidade ${data.quality || 'HD'}`
                    }));

                if (validStreams.length > 0) {
                    console.log(`[Firestore] Links válidos encontrados para o filme ${tmdbId}`);
                    return validStreams;
                }
            }
        }
        console.log(`[Firestore] Nenhum link válido (.mp4) encontrado para o filme ${tmdbId}`);
        return null;
    } catch (error) {
        console.error("[Firestore] Erro ao buscar filme:", error);
        return null;
    }
}

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  const firestoreStreams = await getFromFirestore(tmdbId);
  
  if (firestoreStreams && firestoreStreams.length > 0) {
    return NextResponse.json({ streams: firestoreStreams });
  }

  return NextResponse.json({ streams: [] });
}