"use client";

import { useSearchParams } from "next/navigation";
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const headers = searchParams.get('headers');
  const filename = searchParams.get('filename') || "video-prime-vicio";

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black p-4">
        <p className="text-red-500 text-center font-bold text-lg max-w-md">
          Não foi possível encontrar o link para download.
        </p>
      </div>
    );
  }

  const downloadProxyUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(videoUrl)}${headers ? `&headers=${headers}` : ''}`;
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Seu download está pronto!</h1>
      <p className="mb-8 text-zinc-400 max-w-sm">
        Clique no botão abaixo para iniciar o download do arquivo.
      </p>
      <a href={downloadProxyUrl} download={filename}>
        <Button className="h-20 w-60 text-lg bg-yellow-400 text-black hover:bg-yellow-500 transition-colors">
          <Download className="mr-3 h-8 w-8" />
          Download
        </Button>
      </a>
    </div>
  );
}