"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Props do componente
interface NewVideoPlayerProps {
    src: string;
    title?: string;
    onClose?: () => void; // Para fechar o player modal
    onShowOptions?: () => void;
}

const NewVideoPlayer: React.FC<NewVideoPlayerProps> = ({ src, title, onClose, onShowOptions }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const progressContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [previousPlaybackRate, setPreviousPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [tooltipTime, setTooltipTime] = useState("00:00");
    const [tooltipPosition, setTooltipPosition] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [feedbackAnimation, setFeedbackAnimation] = useState<{ type: 'rewind' | 'forward' | 'speed'; key: number } | null>(null);
    const [lastTap, setLastTap] = useState(0);
    const [isLongPressActive, setIsLongPressActive] = useState(false);
    const [showLogo, setShowLogo] = useState(false);


    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const hideControls = useCallback(() => {
        if (videoRef.current?.paused || isScrubbing) return;
        setControlsVisible(false);
    }, [isScrubbing]);
    
    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (!videoRef.current?.paused) {
            controlsTimeoutRef.current = setTimeout(hideControls, 3000);
        }
    }, [hideControls]);

    useEffect(() => {
      showControls();
    }, [showControls, isPaused]);

    useEffect(() => {
        const video = videoRef.current;
        const container = playerContainerRef.current;
        if (!video || !container) return;

        const updatePlayPause = () => {
            setIsPlaying(!video.paused);
            setIsPaused(video.paused);
        };
        const updateTime = () => {
            if (!isScrubbing) setCurrentTime(video.currentTime);
            if (video.currentTime >= 10) setShowLogo(true);
        };
        const updateDuration = () => setDuration(video.duration);
        const updateLoading = () => setIsLoading(true);
        const updateCanPlay = () => setIsLoading(false);
        const updateBuffer = () => {
            if (video.buffered.length > 0) {
                setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
            }
        };
        const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
          if (!document.fullscreenElement && screen.orientation && typeof screen.orientation.unlock === 'function') {
            screen.orientation.unlock();
          }
        };

        video.addEventListener('play', updatePlayPause);
        video.addEventListener('pause', updatePlayPause);
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('waiting', updateLoading);
        video.addEventListener('canplay', updateCanPlay);
        video.addEventListener('progress', updateBuffer);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        container.addEventListener('mousemove', showControls);
        container.addEventListener('mouseleave', hideControls);


        return () => {
            video.removeEventListener('play', updatePlayPause);
            video.removeEventListener('pause', updatePlayPause);
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('waiting', updateLoading);
            video.removeEventListener('canplay', updateCanPlay);
            video.removeEventListener('progress', updateBuffer);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            container.removeEventListener('mousemove', showControls);
            container.removeEventListener('mouseleave', hideControls);
        };
    }, [isScrubbing, showControls, hideControls]);
    
    // AutoPlay
    useEffect(() => {
      if (videoRef.current && !isPaused) {
        videoRef.current.play().catch(() => {
          // Autoplay was prevented.
          setIsPaused(true);
        });
      }
    }, [src, isPaused]);


    const triggerFeedbackAnimation = (type: 'rewind' | 'forward' | 'speed') => {
        setFeedbackAnimation({ type, key: Date.now() });
        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = setTimeout(() => setFeedbackAnimation(null), 800);
    };

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }, []);

    // ** CORREÇÃO 1: Lógica centralizada para clique/toque único **
    const handleSingleClick = useCallback(() => {
        togglePlay();
        showControls();
    }, [togglePlay, showControls]);

    const handleSeek = (amount: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += amount;
            triggerFeedbackAnimation(amount > 0 ? 'forward' : 'rewind');
            showControls();
        }
    };

    const handleSpeedChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setPreviousPlaybackRate(rate);
            setSettingsMenuOpen(false);
        }
    };

    const toggleFullscreen = async () => {
        const container = playerContainerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            await container.requestFullscreen();
            try {
                if (screen.orientation && typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {
                console.warn("Não foi possível travar a orientação da tela:", err);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
      }
    };
    
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        
        const newMuted = !video.muted;
        video.muted = newMuted;
        setIsMuted(newMuted);
        if(!newMuted && video.volume === 0){
             video.volume = 1;
             setVolume(1);
        }
    };

    // --- Lógica de Arrastar (Scrubbing) ---
    const handleScrubbing = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const container = progressContainerRef.current;
        if (!container || !videoRef.current) return;

        const rect = container.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const percentage = Math.min(Math.max(0, (x - rect.left) / rect.width), 1);
        
        const time = percentage * duration;
        setCurrentTime(time);
        
        if (isScrubbing && videoRef.current) {
            videoRef.current.currentTime = time;
        }
        
        setTooltipPosition(percentage * 100);
        setTooltipTime(formatTime(time));
    };

    const startScrubbing = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        setIsScrubbing(true);
        setShowTooltip(true);
        handleScrubbing(e);
    };

    const endScrubbing = () => {
        if(isScrubbing && videoRef.current){
            videoRef.current.currentTime = currentTime;
        }
        setIsScrubbing(false);
        setShowTooltip(false);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isScrubbing) handleScrubbing(e as any);
        };
        const handleMouseUp = () => {
            if (isScrubbing) endScrubbing();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isScrubbing, handleScrubbing]);
    
     // --- Lógica de Teclado ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            switch (e.key.toLowerCase()) {
                case 'k':
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowleft':
                    handleSeek(-10);
                    break;
                case 'arrowright':
                    handleSeek(10);
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'm':
                    toggleMute();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);


    // --- Lógica de Toque ---
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPressActive(true);
            if (videoRef.current) videoRef.current.playbackRate = 2.0;
            triggerFeedbackAnimation('speed');
        }, 500);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

        if (isLongPressActive) {
            if (videoRef.current) videoRef.current.playbackRate = previousPlaybackRate;
            setIsLongPressActive(false);
            setFeedbackAnimation(null);
            return;
        }

        const now = new Date().getTime();
        const timeSinceLastTap = now - lastTap;
        
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) { // Double tap
            const rect = playerContainerRef.current!.getBoundingClientRect();
            const touchX = e.changedTouches[0].clientX - rect.left;
            if (touchX > rect.width * 0.5) {
                handleSeek(10);
            } else {
                handleSeek(-10);
            }
        } else { // Single tap
            singleTapTimerRef.current = setTimeout(() => {
                handleSingleClick(); // ** CORREÇÃO 1: Usando a nova função centralizada **
            }, 300);
        }
        setLastTap(now);
    };
    
    return (
        <>
        <style>{`
          .player-container { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
          .seek-indicator { display: none; }
          .seek-indicator.animate { display: flex; animation: seek-animation 0.8s ease-out forwards; }
          @keyframes seek-animation { 0% { opacity: 0; transform: scale(0.8); } 20% { opacity: 1; transform: scale(1.1); } 80% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); } }
          .player-logo { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
          .player-logo.visible { opacity: 1; transform: translateY(0); }
        `}</style>
        <div ref={playerContainerRef} className={`player-container w-full h-full aspect-video bg-black relative group overflow-hidden rounded-lg ${!controlsVisible && !isPaused ? 'cursor-none' : ''}`}>
            
            <video ref={videoRef} src={src} className="w-full h-full object-contain" playsInline />
            
            {/* Overlay para cliques/toques */}
            <div 
              className="absolute inset-0 z-10" 
              onClick={handleSingleClick} // ** CORREÇÃO 1: Usando a nova função centralizada **
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
            
             {/* Logo */}
             {showLogo && (
                 <img src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png" alt="Logo" className={`player-logo absolute bottom-4 left-4 h-8 z-10 pointer-events-none transition-all duration-300 ${showLogo ? 'visible' : ''}`} />
             )}

            {/* Loading Spinner */}
            {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30"><div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>}
            
            {/* Feedback de Animação */}
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none z-20 text-white">
               <div className={`seek-indicator flex-col items-center justify-center bg-black/50 w-24 h-24 rounded-full ${feedbackAnimation?.type === 'rewind' && feedbackAnimation.key ? 'animate' : ''}`}>
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 4.5v3.1c3.12 0.44 5.5 3.12 5.5 6.4c0 3.54-2.86 6.4-6.4 6.4s-6.4-2.86-6.4-6.4c0-2.02 0.94-3.84 2.4-5.02l-1.48-1.34c-1.92 1.58-3.12 3.9-3.12 6.36c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.18-3.16-7.6-7.2-7.94V1l-5 4l5 4.5z"/><text x="12" y="15" fontFamily="sans-serif" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">10</text></svg>
               </div>
               <div className={`seek-indicator flex-col items-center justify-center bg-black/50 w-24 h-24 rounded-full ${feedbackAnimation?.type === 'forward' || feedbackAnimation?.type === 'speed' ? 'animate' : ''}`}>
                 {feedbackAnimation?.type !== 'speed' && <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 4.5v3.1c-3.12 0.44-5.5 3.12-5.5 6.4c0 3.54 2.86 6.4 6.4 6.4s6.4-2.86 6.4-6.4c0-2.02-0.94-3.84-2.4-5.02l1.48-1.34c1.92 1.58 3.12 3.9 3.12 6.36c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.18 3.16-7.6 7.2-7.94V1l5 4l-5 4.5z"/><text x="12" y="15" fontFamily="sans-serif" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">10</text></svg>}
                 {feedbackAnimation?.type === 'speed' && <div className="text-center"><span className="text-3xl font-bold">2x</span><span className="text-xs block">Acelerando</span></div>}
               </div>
            </div>

            {/* ** CORREÇÃO 2: Botão de Play Central aumentado ** */}
            {isPaused && !isLoading && (
                 <button onClick={togglePlay} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-48 h-48 transition-transform hover:scale-105 bg-transparent border-none">
                     <img src="https://i.ibb.co/DDnVHSHW/1-1.png" alt="Play" className="w-full h-full object-contain pointer-events-none" draggable="false" />
                 </button>
            )}

            {/* Controles */}
            <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 z-20 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Controles Superiores */}
                <div className="p-4 flex justify-between items-center pointer-events-auto">
                    {onShowOptions && <button onClick={onShowOptions} className="text-white text-sm px-4 py-2 rounded-md bg-black/50 backdrop-blur-sm">Mais Opções</button>}
                    {onClose && <button onClick={onClose} className="text-white text-sm px-4 py-2 rounded-md bg-black/50 backdrop-blur-sm">Fechar</button>}
                </div>

                {/* Controles Inferiores */}
                <div className="p-4 pt-0 pointer-events-auto">
                    {/* Barra de Progresso */}
                    <div 
                        ref={progressContainerRef} 
                        className="relative w-full mb-2 group cursor-pointer py-2" // Adicionado py-2 para aumentar área de toque
                        onMouseDown={startScrubbing}
                        onMouseMove={(e) => { if(isScrubbing) { handleScrubbing(e); } else { setShowTooltip(true); handleScrubbing(e); } } }
                        onMouseLeave={() => setShowTooltip(false)}
                        onTouchStart={startScrubbing}
                        onTouchMove={handleScrubbing}
                        onTouchEnd={endScrubbing}
                    >
                         {showTooltip && <div className="absolute bottom-full mb-2 px-2 py-1 bg-black/75 text-white text-xs rounded pointer-events-none transform -translate-x-1/2" style={{left: `${tooltipPosition}%`}}>{tooltipTime}</div>}
                         <div className="bg-white/30 h-1.5 w-full rounded-full relative group-hover:h-2 transition-all duration-200">
                             <div className="absolute top-0 left-0 h-full bg-white/50 rounded-full" style={{ width: `${buffered}%` }}></div>
                             <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}>
                                 <div className="absolute right-0 top-1/2 w-3 h-3 bg-red-600 rounded-full transform -translate-y-1/2 translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-200"></div>
                             </div>
                         </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-white bg-neutral-800/80 backdrop-blur-sm rounded-md px-4 py-2">
                         {/* Controles da Esquerda */}
                         <div className="flex items-center space-x-4">
                             <button onClick={togglePlay} className="control-btn" title="Play/Pause (Espaço)">
                                 {isPlaying ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"></path></svg>}
                             </button>
                             <div className="volume-container relative flex items-center group/volume">
                                <button onClick={toggleMute} className="control-btn" title="Mudo (M)">
                                    {isMuted || volume === 0 ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>}
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/volume:flex">
                                  <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider w-20 h-1 accent-red-600" />
                                </div>
                             </div>
                             <div className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
                         </div>
                         {/* Controles da Direita */}
                         <div className="flex items-center space-x-4">
                             <div className="relative">
                                 <button onClick={() => setSettingsMenuOpen(prev => !prev)} className="control-btn" title="Configurações">
                                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.68-1.62-0.87L14.05,2.5 C14.02,2.24,13.81,2.05,13.54,2.05L10.46,2.05c-0.27,0-0.48,0.19-0.51,0.45L9.56,4.93c-0.59,0.19-1.12,0.49-1.62,0.87L5.55,4.84 c-0.22-0.08-0.47,0-0.59,0.22L3.04,8.38c-0.11,0.2-0.06,0.47,0.12,0.61l2.03,1.58C5.02,11.36,5,11.68,5,12 c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96 c0.5,0.38,1.03,0.68,1.62,0.87l0.39,2.42c0.03,0.26,0.24,0.45,0.51,0.45l3.08,0c0.27,0,0.48-0.19,0.51-0.45l0.39-2.42 c0.59-0.19,1.12-0.49,1.62-0.87l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.11-0.2,0.06-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"></path></svg>
                                 </button>
                                 {settingsMenuOpen && (
                                     <div className="absolute bottom-12 right-0 bg-black/80 backdrop-blur-sm rounded-md p-2 w-32">
                                         <p className="text-xs text-zinc-400 px-2 pb-1">Velocidade</p>
                                         {[0.5, 0.75, 1, 1.5, 2].map(speed => (
                                             <button key={speed} onClick={() => handleSpeedChange(speed)} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-white/10 ${playbackRate === speed ? 'font-bold' : ''}`}>
                                                 {speed === 1 ? 'Normal' : `${speed}x`}
                                             </button>
                                         ))}
                                     </div>
                                 )}
                             </div>
                             <button onClick={toggleFullscreen} className="control-btn" title="Tela Cheia (F)">
                                 {isFullscreen ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>}
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default NewVideoPlayer;