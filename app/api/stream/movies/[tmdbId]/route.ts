import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  try {
    // FIX: Treat tmdbId as a string, which is likely how it's stored in Firestore.
    const streamsQuery = query(
        collection(firestore, "streams"), 
        where("tmdbId", "==", tmdbId), // No longer converting to number
        where("media_type", "==", "movie")
    );
    const streamsSnapshot = await getDocs(streamsQuery);
    
    if (streamsSnapshot.empty) {
        // This log helps debug if a specific movie isn't found
        console.log(`[API/MOVIES] No stream document found for tmdbId: ${tmdbId}`);
        return NextResponse.json({ streams: [] });
    }

    const streams = streamsSnapshot.docs
      .map(doc => doc.data())
      .filter(stream => stream.url && stream.url.includes("short.icu"));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error(`Error fetching streams for movie ${tmdbId}:`, error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}