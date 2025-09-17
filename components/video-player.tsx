"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Maximize, Minimize, Rewind, FastForward, Check, Loader2, ChevronsRight, ChevronsLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

// Tipos
type Episode = { id: number; name: string; episode_number: number };
type Season = { id: number; name: string; season_number: number };

type VideoPlayerProps = {
  src: string;
  title: string;
  onShowOptions?: () => void;
  mediaType: "movie" | "tv";
  tmdbId?: string;
  seasons?: Season[];
  currentSeason?: number;
  currentEpisode?: number;
};

export default function VideoPlayer({ src, title, onShowOptions }: VideoPlayerProps) {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTapRef = useRef(0);
  const seekAnimationTimeoutRef = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<'forward' | 'rewind' | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<{ time: string; position: number } | null>(null);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // --- Funções de Controle do Player ---
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

  const triggerSeekAnimation = (direction: 'forward' | 'rewind') => {
    setSeekIndicator(direction);
    clearTimeout(seekAnimationTimeoutRef.current);
    seekAnimationTimeoutRef.current = setTimeout(() => {
      setSeekIndicator(null);
    }, 600);
  };

  const handleSeek = useCallback((amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      triggerSeekAnimation(amount > 0 ? 'forward' : 'rewind');
    }
  }, []);
  
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  // --- Manipuladores de Eventos ---
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Lógica de Toque Duplo (Celular)
    if (isMobile && timeSinceLastTap < 300) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const touchX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const touchPosition = (touchX - rect.left) / rect.width;

      if (touchPosition < 0.4) { // Lado esquerdo
        handleSeek(-10);
      } else if (touchPosition > 0.6) { // Lado direito
        handleSeek(10);
      }
      lastTapRef.current = 0; // Reseta para evitar triplo toque
      return;
    }
    
    lastTapRef.current = now;

    // Lógica de Toque/Clique Único
    if(isMobile) {
      setShowControls(s => !s);
    } else {
      togglePlay();
    }
  };
  
  // --- Efeitos ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(video.currentTime);
      if (video.currentTime >= 10 && !showLogo) setShowLogo(true);
    };
    const onLoadedMetadata = () => setDuration(video.duration);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [isSeeking, showLogo]);

  useEffect(() => {
    const hide = () => { if (isPlaying) setShowControls(false); };
    const resetTimeout = () => {
      clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(hide, 3000);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimeout);
      container.addEventListener("mouseleave", hide);
    }
    resetTimeout();
    return () => {
      clearTimeout(controlsTimeoutRef.current);
      if (container) {
        container.removeEventListener("mousemove", resetTimeout);
        container.removeEventListener("mouseleave", hide);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        switch(e.key) {
            case ' ': e.preventDefault(); togglePlay(); break;
            case 'ArrowLeft': handleSeek(-10); break;
            case 'ArrowRight': handleSeek(10); break;
            case 'f': toggleFullscreen(); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSeek, togglePlay, toggleFullscreen]);
  
  // --- Handlers da Barra de Progresso ---
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || isMobile) return;
    const rect = progressRef.current!.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const time = duration * position;
    setThumbnailPreview({
        time: formatTime(time),
        position: position * 100
    });
  };

  const handleSliderChange = (value: number[]) => {
    setIsSeeking(true);
    setCurrentTime(value[0]);
  };

  const handleSliderCommit = (value: number[]) => {
    if (videoRef.current) videoRef.current.currentTime = value[0];
    setIsSeeking(false);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-video bg-black rounded-xl overflow-hidden group",
          !showControls && !isMobile && isPlaying && "cursor-none"
        )}
      >
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          autoPlay
        />
        
        {/* Camada de Interação */}
        <div className="absolute inset-0 z-10" onClick={handleInteraction} />

        <AnimatePresence>
          {showLogo && (
            <motion.img
              src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
              alt="Logo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-14 left-4 h-6 z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}
        
        {/* Animação de Avançar/Retroceder */}
        <AnimatePresence>
            {seekIndicator && (
                <motion.div
                    key={seekIndicator}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                    <div className="bg-black/50 rounded-full p-4">
                        {seekIndicator === 'forward' ? <ChevronsRight className="h-10 w-10 text-white" /> : <ChevronsLeft className="h-10 w-10 text-white" />}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>


        <AnimatePresence>
          {!isPlaying && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <Button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                size="icon"
                variant="ghost"
                className="h-16 w-16 bg-black/50 rounded-full pointer-events-auto"
              >
                <Play className="h-8 w-8 text-white" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none"
            >
              <div className="p-3 pointer-events-auto">
                {onShowOptions && <Button variant="ghost" className="h-auto px-4 py-2 text-sm text-white bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm" onClick={onShowOptions}>Mais Opções</Button>}
              </div>

              <div className="bg-gradient-to-t from-black/70 to-transparent p-3 md:p-4 pointer-events-auto">
                <div ref={progressRef} className="relative w-full" onMouseMove={handleProgressHover} onMouseLeave={() => setThumbnailPreview(null)}>
                  {thumbnailPreview && (
                      <div className="absolute bottom-6 bg-black/80 text-white text-xs px-2 py-1 rounded-md" style={{ left: `${thumbnailPreview.position}%`, transform: 'translateX(-50%)' }}>
                          {thumbnailPreview.time}
                      </div>
                  )}
                  <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={1}
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="w-full h-2 mb-2"
                  />
                </div>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip><TooltipTrigger asChild><Button onClick={togglePlay} size="icon" variant="ghost">{isPlaying ? <Pause /> : <Play />}</Button></TooltipTrigger><TooltipContent>{isPlaying ? "Pausar" : "Reproduzir"}</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => handleSeek(-10)} size="icon" variant="ghost"><Rewind /></Button></TooltipTrigger><TooltipContent>-10s</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => handleSeek(10)} size="icon" variant="ghost"><FastForward /></Button></TooltipTrigger><TooltipContent>+10s</TooltipContent></Tooltip>
                    <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip><TooltipTrigger asChild><Button onClick={toggleFullscreen} size="icon" variant="ghost">{isFullscreen ? <Minimize /> : <Maximize />}</Button></TooltipTrigger><TooltipContent>Tela Cheia</TooltipContent></Tooltip>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

