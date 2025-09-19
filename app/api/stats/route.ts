import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
  try {
    const moviesQuery = query(collection(db, "streams"), where("playerType", "==", "abyss"), where("media_type", "==", "movie"));
    const moviesSnapshot = await getDocs(moviesQuery);
    const movies = moviesSnapshot.size;

    const seriesQuery = query(collection(db, "streams"), where("playerType", "==", "abyss"), where("media_type", "==", "tv"));
    const seriesSnapshot = await getDocs(seriesQuery);
    const seriesSet = new Set(seriesSnapshot.docs.map(doc => doc.data().tmdbId));
    const series = seriesSet.size;

    let episodes = 0;
    for (const serieId of seriesSet) {
        const episodesQuery = query(collection(db, `streams/${serieId}/episodes`), where("playerType", "==", "abyss"));
        const episodesSnapshot = await getDocs(episodesQuery);
        episodes += episodesSnapshot.size;
    }

    return NextResponse.json({
      movies,
      series,
      episodes,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}