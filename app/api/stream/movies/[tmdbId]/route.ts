import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Função para identificar o tipo de link
function getStreamType(url: string) {
    if (url.includes('short.icu')) {
        return 'abyss';
    }
    if (url.endsWith('.mp4')) {
        return 'custom';
    }
    return 'unknown';
}

async function getFromFirestore(tmdbId: string) {
    try {
        const docRef = doc(firestore, "media", tmdbId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const movieData = docSnap.data();
            if (movieData.urls && movieData.urls.length > 0) {
                const validStreams = movieData.urls
                    .map((data: any) => ({
                        url: data.url,
                        name: data.url.includes('short.icu') ? "Servidor Abyss" : "Servidor Principal",
                        description: `Qualidade ${data.quality || 'HD'}`,
                        spriteUrl: data.spriteUrl || null,
                        playerType: getStreamType(data.url) // Adiciona o tipo de player
                    }))
                    .filter((stream: any) => stream.playerType !== 'unknown' && !stream.url.includes('superflixapi.shop'));

                if (validStreams.length > 0) {
                    console.log(`[Firestore] Links válidos encontrados para o filme ${tmdbId}`);
                    return validStreams;
                }
            }
        }
        console.log(`[Firestore] Nenhum link válido encontrado para o filme ${tmdbId}`);
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