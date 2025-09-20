import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  try {
    const streamsQuery = query(
        collection(firestore, "streams"), 
        where("tmdbId", "==", tmdbId),
        where("media_type", "==", "movie")
    );
    let streamsSnapshot = await getDocs(streamsQuery);

    // Fallback: Se não encontrar resultados com string, tenta buscar como número
    if (streamsSnapshot.empty) {
      const tmdbIdAsNumber = parseInt(tmdbId, 10);
      if (!isNaN(tmdbIdAsNumber)) {
        const numericQuery = query(
          collection(firestore, "streams"), 
          where("tmdbId", "==", tmdbIdAsNumber),
          where("media_type", "==", "movie")
        );
        streamsSnapshot = await getDocs(numericQuery);
      }
    }
    
    if (streamsSnapshot.empty) {
        // Este log ajuda a depurar se um filme específico não for encontrado
        console.log(`[API/MOVIES] Nenhum documento de stream encontrado para o tmdbId: ${tmdbId}`);
        return NextResponse.json({ streams: [] });
    }

    const streams = streamsSnapshot.docs
      .map(doc => doc.data())
      .filter(stream => stream.url && stream.url.includes("short.icu"));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error(`Erro ao buscar streams para o filme ${tmdbId}:`, error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}