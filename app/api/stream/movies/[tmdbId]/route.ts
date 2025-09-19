import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  // Não busca mais no Firestore, apenas retorna uma estrutura vazia ou um erro,
  // pois o embed agora é direto.
  return NextResponse.json({ streams: [] });
}