import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase"; // Corrigido para firestore
import { collection, getDocs, query, where, documentId } from "firebase/firestore";

export async function GET() {
  try {
    // --- Contagem de Filmes ---
    const moviesCollection = collection(firestore, "streams");
    const moviesQuery = query(moviesCollection, where("media_type", "==", "movie"));
    const moviesSnapshot = await getDocs(moviesQuery);
    const abyssMovies = moviesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.url && data.url.includes("short.icu");
    });
    const moviesCount = abyssMovies.length;

    // --- Contagem de Séries ---
    const seriesCollection = collection(firestore, "streams");
    const seriesQuery = query(seriesCollection, where("media_type", "==", "tv"));
    const seriesSnapshot = await getDocs(seriesQuery);
    const seriesWithAbyssEpisodes = new Set<string>();

    let episodesCount = 0;

    // Itera sobre cada documento de série para verificar os episódios
    for (const seriesDoc of seriesSnapshot.docs) {
        const episodesCollection = collection(firestore, `streams/${seriesDoc.id}/episodes`);
        const episodesSnapshot = await getDocs(episodesCollection);

        const abyssEpisodes = episodesSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.url && data.url.includes("short.icu");
        });
        
        if (abyssEpisodes.length > 0) {
            seriesWithAbyssEpisodes.add(seriesDoc.id);
            episodesCount += abyssEpisodes.length;
        }
    }
    const seriesCount = seriesWithAbyssEpisodes.size;


    return NextResponse.json({
      movies: moviesCount,
      series: seriesCount,
      episodes: episodesCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}