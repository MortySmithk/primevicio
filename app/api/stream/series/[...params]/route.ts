import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { params: string[] } }) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  // Não busca mais no Firestore, apenas retorna uma estrutura vazia ou um erro,
  // pois o embed agora é direto.
  return NextResponse.json({ streams: [] });
}