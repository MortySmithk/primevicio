import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

function hasValidLink(urls: any): boolean {
    if (!Array.isArray(urls) || urls.length === 0) return false;
    return urls.some(u => 
        typeof u === 'object' && u !== null && 
        typeof u.url === 'string' && 
        u.url.endsWith('.mp4') && 
        !u.url.includes('superflixapi.shop')
    );
}

export async function GET() {
  try {
    const mediaCollection = collection(firestore, "media");
    const mediaSnapshot = await getDocs(mediaCollection);

    let movieCount = 0;
    let seriesCount = 0;
    let episodeCount = 0;

    mediaSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.type === 'movie') {
        if (hasValidLink(data.urls)) {
            movieCount++;
        }
      } 
      else if (data.type === 'series') {
        let seriesHasAtLeastOneValidEpisode = false;
        if (data.seasons && typeof data.seasons === 'object') {
          Object.values(data.seasons).forEach((season: any) => {
            if (season.episodes && Array.isArray(season.episodes)) {
              season.episodes.forEach((episode: any) => {
                if (hasValidLink(episode.urls)) {
                    episodeCount++;
                    seriesHasAtLeastOneValidEpisode = true;
                }
              });
            }
          });
        }
        if (seriesHasAtLeastOneValidEpisode) {
            seriesCount++;
        }
      }
    });

    return NextResponse.json({
      movies: movieCount,
      series: seriesCount,
      episodes: episodeCount,
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}