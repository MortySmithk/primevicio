// app/api/stream/movies/[tmdbId]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  try {
    const docRef = doc(firestore, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Assume que a URL está no campo 'url' e é do tipo 'movie'
      if (data.type === 'movie' && data.urls && data.urls.length > 0 && data.urls[0].url.includes("short.icu")) {
        const stream = {
            playerType: 'abyss', // Mantendo a lógica anterior se necessário
            url: data.urls[0].url,
            name: data.urls[0].quality || "Fonte Principal"
        };
        return NextResponse.json({ streams: [stream] });
      }
    }
    
    console.log(`[API/MOVIES] Nenhum stream encontrado para o tmdbId: ${tmdbId}`);
    return NextResponse.json({ streams: [] });

  } catch (error) {
    console.error(`Erro ao buscar streams para o filme ${tmdbId}:`, error);
    return NextResponse.json({ error: "Falha ao buscar streams" }, { status: 500 });
  }
}