import { NextResponse } from "next/server";

export async function GET() {
  // Retorna os valores de estatísticas fixos conforme solicitado.
  return NextResponse.json({
    movies: 10930,
    series: 6064,
    episodes: 190195,
  });
}