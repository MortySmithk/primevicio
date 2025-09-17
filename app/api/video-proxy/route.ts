import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("videoUrl");
  const encodedHeaders = searchParams.get("headers");

  if (!videoUrl) {
    return new NextResponse("URL do vídeo não fornecida.", { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(videoUrl);
    const target = new URL(decodedUrl);

    const headersToSend = new Headers();

    headersToSend.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
    headersToSend.set("Accept", "*/*");
    headersToSend.set("Connection", "keep-alive");
    
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      headersToSend.set("Range", rangeHeader);
    }
    
    let refererToAdd = target.origin + "/";
    if (encodedHeaders) {
        try {
            const decoded = JSON.parse(decodeURIComponent(encodedHeaders));
            const customHeaders = decoded?.request && typeof decoded.request === 'object' ? decoded.request : decoded;
            for (const [key, value] of Object.entries(customHeaders)) {
                if (typeof value === 'string') {
                    if (key.toLowerCase() === 'referer') {
                        refererToAdd = value;
                    } else {
                        headersToSend.set(key, value);
                    }
                }
            }
        } catch (e) {
            console.error("[VideoProxy] Erro ao decodificar cabeçalhos:", e);
        }
    }

    headersToSend.set("Referer", refererToAdd);

    const videoResponse = await fetch(target.href, {
      headers: headersToSend,
      cache: "no-store",
    });

    if (!videoResponse.ok) {
      return new NextResponse(`Falha ao buscar o vídeo: ${videoResponse.statusText}`, {
        status: videoResponse.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", videoResponse.headers.get("Content-Type") || "video/mp4");
    responseHeaders.set("Content-Length", videoResponse.headers.get("Content-Length") || "");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Connection", "keep-alive");

    if (videoResponse.headers.get("Content-Range")) {
      responseHeaders.set("Content-Range", videoResponse.headers.get("Content-Range")!);
    }

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Range");

    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      statusText: videoResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[VideoProxy] Erro:", error);
    return new NextResponse("Erro interno no proxy de vídeo.", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
    },
  });
}
