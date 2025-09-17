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

export default function VideoPlayer({
  src,
  title,
  onShowOptions,
}: VideoPlayerProps) {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTap = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [thumbnail, setThumbnail] = useState<{ src: string; time: number; left: number } | null>(null);
  const [seekAnimation, setSeekAnimation] = useState<"forward" | "rewind" | null>(null);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes().toString().padStart(2, "0");
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

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
      if (!isSeeking) {
         setCurrentTime(video.currentTime);
      }
      if (video.currentTime >= 10) {
        setShowLogo(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      stopAnimation();
    };
  }, [isSeeking, handlePlay, handlePause, stopAnimation]);

  // Controla a visibilidade dos controles
  useEffect(() => {
    const hideControls = () => isPlaying && setShowControls(false);
    const resetTimeout = () => {
      clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
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
    if(isPlaying) startAnimation();
  };
  
  const triggerSeekAnimation = (direction: "forward" | "rewind") => {
    setSeekAnimation(direction);
    setTimeout(() => setSeekAnimation(null), 600);
  };

  const togglePlay = () => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
  
  const seek = (amount: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime += amount;
        triggerSeekAnimation(amount > 0 ? "forward" : "rewind");
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Double tap to seek for mobile
  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = new Date().getTime();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      
      if (touchX < rect.width / 2) {
        seek(-10);
      } else {
        seek(10);
      }
    } else {
        setShowControls(s => !s);
    }
    lastTap.current = now;
  };
  
  const handleAreaClick = () => {
    if (!isMobile) {
      togglePlay();
    }
  };

  // Keyboard controls
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.target as HTMLElement).tagName === 'INPUT') return;
          switch (e.key) {
              case "ArrowRight":
                  seek(10);
                  break;
              case "ArrowLeft":
                  seek(-10);
                  break;
              case " ":
                  e.preventDefault();
                  togglePlay();
                  break;
              case "f":
                  toggleFullscreen();
                  break;
          }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seek, togglePlay, toggleFullscreen]);


  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = duration * percentage;

    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = 160;
    thumbnailCanvas.height = 90;
    const ctx = thumbnailCanvas.getContext("2d");
    if (ctx) {
        // Clonamos o video para não afetar o principal
        const tempVideo = videoRef.current.cloneNode(true) as HTMLVideoElement;
        tempVideo.currentTime = time;
        tempVideo.onseeked = () => {
            ctx.drawImage(tempVideo, 0, 0, 160, 90);
            setThumbnail({
                src: thumbnailCanvas.toDataURL(),
                time: time,
                left: x
            });
        }
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-video bg-black rounded-xl overflow-hidden group",
          !showControls && "cursor-none"
        )}
        onTouchEnd={isMobile ? handleTouch : undefined}
      >
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          autoPlay
          onClick={handleAreaClick}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          crossOrigin="anonymous" // Necessário para gerar thumbnail do canvas
        />
        
        {/* Animação de Avançar/Retroceder */}
        <AnimatePresence>
          {seekAnimation && (
            <motion.div
              key={seekAnimation}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0], scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white bg-black/40 p-4 rounded-full pointer-events-none",
                seekAnimation === 'rewind' && 'left-1/4 -translate-x-1/2',
                seekAnimation === 'forward' && 'right-1/4 translate-x-1/2'
              )}
            >
             {seekAnimation === 'rewind' ? <ChevronsLeft size={48} /> : <ChevronsRight size={48} />}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLogo && (
            <motion.img
              src="https://i.ibb.co/s91tycz/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
              alt="Logo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-0 left-0 h-6 z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}

        <AnimatePresence>
          {!isPlaying && !isLoading &&(
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
              <div className="p-3 pointer-events-auto flex justify-between items-center">
                <Button variant="ghost" className="h-auto px-4 py-2 text-sm text-white bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm" onClick={onShowOptions}>
                  Mais Opções
                </Button>
                 <h1 className="text-white font-bold text-lg bg-black/30 p-2 rounded-md">{title}</h1>
              </div>

              <div className="bg-gradient-to-t from-black/70 to-transparent p-3 md:p-4 pointer-events-auto">
                <div
                  ref={progressRef}
                  className="relative group/progress"
                  onMouseMove={handleProgressHover}
                  onMouseLeave={() => setThumbnail(null)}
                >
                  <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="w-full h-2 mb-2"
                  />
                  {thumbnail && (
                    <div
                      className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none"
                      style={{ left: `${thumbnail.left}px` }}
                    >
                      <div className="relative bg-black border-2 border-white rounded-md w-40 h-[90px] overflow-hidden">
                         <img src={thumbnail.src} className="w-full h-full object-cover" />
                         <p className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                           {formatTime(thumbnail.time)}
                         </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip><TooltipTrigger asChild><Button onClick={togglePlay} size="icon" variant="ghost">{isPlaying ? <Pause /> : <Play />}</Button></TooltipTrigger><TooltipContent>{isPlaying ? "Pausar" : "Reproduzir"}</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => seek(-10)} size="icon" variant="ghost"><Rewind /></Button></TooltipTrigger><TooltipContent>-10s (←)</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button onClick={() => seek(10)} size="icon" variant="ghost"><FastForward /></Button></TooltipTrigger><TooltipContent>+10s (→)</TooltipContent></Tooltip>
                    <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Tooltip><TooltipTrigger asChild><Button onClick={toggleFullscreen} size="icon" variant="ghost">{isFullscreen ? <Minimize /> : <Maximize />}</Button></TooltipTrigger><TooltipContent>Tela Cheia (f)</TooltipContent></Tooltip>
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