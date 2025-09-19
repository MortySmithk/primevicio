import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { tmdbId: string } }) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  try {
    const streamsQuery = query(collection(db, "streams"), where("tmdbId", "==", tmdbId), where("playerType", "==", "abyss"), where("media_type", "==", "movie"));
    const streamsSnapshot = await getDocs(streamsQuery);
    
    if (streamsSnapshot.empty) {
        return NextResponse.json({ streams: [] });
    }

    const streams = streamsSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ streams });
  } catch (error) {
    console.error(`Error fetching streams for movie ${tmdbId}:`, error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}