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
      if (data.type === 'movie' && data.urls && data.urls.length > 0) {
        const validStream = data.urls.find((u: any) => u?.url?.includes("short.icu"));
        
        if (validStream) {
          const stream = {
              playerType: 'abyss',
              url: validStream.url,
              name: validStream.quality || "Fonte Principal"
          };
          return NextResponse.json({ streams: [stream] });
        }
      }
    }
    
    return NextResponse.json({ streams: [] });

  } catch (error) {
    console.error(`Erro ao buscar streams para o filme ${tmdbId}:`, error);
    return NextResponse.json({ error: "Falha ao buscar streams" }, { status: 500 });
  }
}