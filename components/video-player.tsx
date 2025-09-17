"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Maximize, Minimize, Rewind, FastForward, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

// Tipos (mantidos para compatibilidade)
type Episode = { id: number; name: string; episode_number: number };
type Season = { id: number; name: string; season_number: number };

type VideoPlayerProps = {
  src: string;
  title: string;
  onShowOptions?: () => void;
  mediaType: "movie" | "tv";
  tmdbId?: string;
  seasons?: Season[];
  initialEpisodes?: Episode[];
  currentSeason?: number;
  currentEpisode?: number;
};

const API_KEY = "001bbf841bab48f314947688a8230535";
const API_BASE_URL = "https://api.themoviedb.org/3";

export default function VideoPlayer({
  src,
  title,
  onShowOptions,
  mediaType,
  tmdbId,
  seasons = [],
  initialEpisodes = [],
  currentSeason = 1,
  currentEpisode = 1,
}: VideoPlayerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  // Lógica de animação da barra de progresso
  const animateProgress = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    }
  }, [isSeeking]);

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, [animateProgress]);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startAnimation();
  }, [startAnimation]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopAnimation();
  }, [stopAnimation]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 10) {
        setShowLogo(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // Controla a visibilidade dos controles
  useEffect(() => {
    const hideControls = () => isPlaying && setShowControls(false);
    const resetTimeout = () => {
      clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(hideControls, 2000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimeout);
      container.addEventListener("mouseleave", hideControls);
    }
    resetTimeout();

    return () => {
      clearTimeout(controlsTimeoutRef.current);
      if (container) {
        container.removeEventListener("mousemove", resetTimeout);
        container.removeEventListener("mouseleave", hideControls);
      }
    };
  }, [isPlaying]);

  // Handlers do Slider
  const handleSliderChange = (value: number[]) => {
    if (!isSeeking) setIsSeeking(true);
    stopAnimation();
    setCurrentTime(value[0]);
  };

  const handleSliderCommit = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
    setIsSeeking(false);
  };

  // Funções do Player
  const togglePlay = () => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
  const seek = (amount: number) => {
    if (videoRef.current) videoRef.current.currentTime += amount;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };
  
  const handleAreaClick = () => {
    if (isMobile) {
      setShowControls(s => !s);
    } else {
      togglePlay();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-video bg-black rounded-xl overflow-hidden group",
          !showControls && "cursor-none"
        )}
      >
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          autoPlay
          onClick={handleAreaClick}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
        />

        <AnimatePresence>
          {showLogo && (
            <motion.img
              src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
              alt="Logo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-0 left-0 h-6 z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}

        {/* Botão de Play Central */}
        <AnimatePresence>
          {!isPlaying && (
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
              className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none"
            >
              <div className="p-3 pointer-events-auto">
                <Button variant="ghost" className="h-auto px-4 py-2 text-sm text-white bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm" onClick={onShowOptions}>
                  Mais Opções
                </Button>
              </div>

              <div className="bg-gradient-to-t from-black/70 to-transparent p-3 md:p-4 pointer-events-auto">
                <Slider
                  value={[currentTime]}
                  max={duration || 1}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  className="w-full h-2 mb-2"
                />
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip><TooltipTrigger asChild><Button onClick={togglePlay} size="icon" variant="ghost">{isPlaying ? <Pause /> : <Play />}</Button></TooltipTrigger><TooltipContent>{isPlaying ? "Pausar" : "Reproduzir"}</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => seek(-10)} size="icon" variant="ghost"><Rewind /></Button></TooltipTrigger><TooltipContent>-10s</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => seek(10)} size="icon" variant="ghost"><FastForward /></Button></TooltipTrigger><TooltipContent>+10s</TooltipContent></Tooltip>
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

