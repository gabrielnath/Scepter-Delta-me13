import React, { useState, useEffect, useRef } from 'react';

const PhainonShrine = () => {
  // Hardcoded start: Oct 12, 2025, 11:30 PM GMT+7
  const START_TIME = new Date('2025-10-12T23:30:00+07:00').getTime();
  const VIDEO_DURATION = 287; // 4:47 in seconds
  const SECONDARY_VIDEO_DURATION = 204; // 3:24 in seconds
  const GRID_SIZE = 100;
  const GOAL = 33550336;
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFullyLoaded, setVideoFullyLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  // Secondary video states
  const [secondaryVideoLoaded, setSecondaryVideoLoaded] = useState(false);
  const [secondaryVideoFullyLoaded, setSecondaryVideoFullyLoaded] = useState(false);
  const [secondaryLoadProgress, setSecondaryLoadProgress] = useState(0);
  const [secondaryIsPlaying, setSecondaryIsPlaying] = useState(false);
  const [secondaryIsMuted, setSecondaryIsMuted] = useState(true);
  const [secondaryVolume, setSecondaryVolume] = useState(100);

  // Canvas and video refs
  const videoRef = useRef(null);
  const secondaryVideoRef = useRef(null);
  const canvasRefs = useRef([]);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);
  const contextCache = useRef({});
  const offscreenCanvas = useRef(null);
  const offscreenCtx = useRef(null);
  const lastFrameTime = useRef(0);
  const FPS_LIMIT = 30;
  const FRAME_INTERVAL = 1000 / FPS_LIMIT;

  // User preference refs (to prevent auto-muting after user sets preference)
  const userMutePreference = useRef(true);
  const userVolumePreference = useRef(100);
  const secondaryUserMutePreference = useRef(true);
  const secondaryUserVolumePreference = useRef(100);

  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  // Calculate elapsed time and stats
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - START_TIME) / 1000));
  const completedLoops = Math.floor(elapsedSeconds / VIDEO_DURATION);
  const currentVideoPosition = elapsedSeconds % VIDEO_DURATION;
  const totalCount = completedLoops * GRID_SIZE;
  const progressPercent = ((totalCount / GOAL) * 100).toFixed(4);

  // Calculate secondary video state
  const isSecondaryWaiting = currentVideoPosition >= SECONDARY_VIDEO_DURATION;
  const secondaryVideoPosition = isSecondaryWaiting ? 0 : currentVideoPosition;

  // Format time display
  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days.toString().padStart(4, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current time every 80 milliseconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
      setSpinnerIndex(prev => (prev + 1) % spinnerFrames.length);
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Initialize offscreen canvas for buffering
  useEffect(() => {
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement('canvas');
      offscreenCanvas.current.width = 120;
      offscreenCanvas.current.height = 120;
      offscreenCtx.current = offscreenCanvas.current.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });
    }
  }, []);

  // Draw video to all 100 canvases - ultra optimized with offscreen buffer
  const drawVideoFrames = (timestamp) => {
    const video = videoRef.current;
    
    if (!video || video.paused || video.ended || video.readyState < 3) {
      animationRef.current = requestAnimationFrame(drawVideoFrames);
      return;
    }

    if (timestamp - lastFrameTime.current < FRAME_INTERVAL) {
      animationRef.current = requestAnimationFrame(drawVideoFrames);
      return;
    }
    lastFrameTime.current = timestamp;

    // Step 1: Draw video to offscreen canvas ONCE (instead of 100 times)
    const offCtx = offscreenCtx.current;
    const offCanvas = offscreenCanvas.current;
    if (offCtx && offCanvas) {
      offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
      offCtx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    }

    // Step 2: Copy from offscreen canvas to all visible canvases (much faster)
    canvasRefs.current.forEach((canvas, index) => {
      if (!canvas) return;
      
      if (!contextCache.current[index]) {
        contextCache.current[index] = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
        });
      }
      const ctx = contextCache.current[index];
      
      // Copy the offscreen canvas (fast image-to-image copy)
      ctx.drawImage(offCanvas, 0, 0);
      
      // Add unique instance ID
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 35, 15);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(index.toString().padStart(3, '0'), 3, 12);
    });

    animationRef.current = requestAnimationFrame(drawVideoFrames);
  };

  // Setup primary video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setVideoLoaded(true);
    };

    const handleCanPlayThrough = () => {
      setVideoFullyLoaded(true);
      if (video.currentTime === 0) {
        video.currentTime = currentVideoPosition;
      }
      // Only set initial mute state, don't override user preferences
      if (userMutePreference.current === true) {
        video.muted = true;
        video.volume = userVolumePreference.current / 100;
      }
      video.play().catch(() => {});
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          setLoadProgress(Math.round(percent));
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!animationRef.current) {
        drawVideoFrames();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(Math.round(video.volume * 100));
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Setup secondary video element
  useEffect(() => {
    const video = secondaryVideoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setSecondaryVideoLoaded(true);
    };

    const handleCanPlayThrough = () => {
      setSecondaryVideoFullyLoaded(true);
      // Only set initial mute state, don't override user preferences
      if (secondaryUserMutePreference.current === true) {
        video.muted = true;
        video.volume = secondaryUserVolumePreference.current / 100;
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          setSecondaryLoadProgress(Math.round(percent));
        }
      }
    };

    const handlePlay = () => {
      setSecondaryIsPlaying(true);
    };

    const handlePause = () => {
      setSecondaryIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setSecondaryIsMuted(video.muted);
      setSecondaryVolume(Math.round(video.volume * 100));
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Sync primary video position
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && videoLoaded) {
        const expectedPosition = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        const currentPos = video.currentTime;
        
        if (Math.abs(currentPos - expectedPosition) > 2) {
          video.currentTime = expectedPosition;
        }
        
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [videoLoaded]);

  // Sync secondary video position - Optimized to run less frequently
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const video = secondaryVideoRef.current;
      if (video && secondaryVideoLoaded) {
        const currentCyclePosition = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        const shouldWait = currentCyclePosition >= SECONDARY_VIDEO_DURATION;
        
        if (shouldWait) {
          // Pause and reset to start when waiting
          if (!video.paused) {
            video.pause();
          }
          if (video.currentTime !== 0) {
            video.currentTime = 0;
          }
        } else {
          // Play and sync when within duration
          const expectedPosition = currentCyclePosition;
          const currentPos = video.currentTime;
          
          // Only sync if drift is significant (more than 2 seconds)
          if (Math.abs(currentPos - expectedPosition) > 2) {
            video.currentTime = expectedPosition;
          }
          
          if (video.paused) {
            video.play().catch(() => {});
          }
        }
      }
    }, 5000); // Check every 5 seconds instead of 1 second

    return () => clearInterval(syncInterval);
  }, [secondaryVideoLoaded]);

  // Handle user click to enable autoplay
  const handleInteraction = () => {
    const video = videoRef.current;
    const secondaryVideo = secondaryVideoRef.current;
    
    if (video && video.paused) {
      video.play();
    }
    
    if (secondaryVideo && secondaryVideo.paused && !isSecondaryWaiting) {
      secondaryVideo.play();
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8" onClick={handleInteraction}>
      {/* Loading Screen */}
      {!videoFullyLoaded && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="border border-green-400/30 p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-2xl mb-2">PHAINON FUNCTION</div>
              <div className="text-xs text-green-400/60">INITIALIZING SYSTEM...</div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span>LOADING PRIMARY VIDEO</span>
                <span>{loadProgress}%</span>
              </div>
              <div className="w-full bg-green-400/10 h-4 border border-green-400/30">
                <div 
                  className="h-full bg-green-400/50 transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span>LOADING SECONDARY VIDEO</span>
                <span>{secondaryLoadProgress}%</span>
              </div>
              <div className="w-full bg-green-400/10 h-4 border border-green-400/30">
                <div 
                  className="h-full bg-green-400/50 transition-all duration-300"
                  style={{ width: `${secondaryLoadProgress}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-green-400/60 text-center">
              {loadProgress < 100 ? 'Please wait...' : 'Ready! Starting system...'}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto border border-green-400/30 p-4 md:p-6">
        
        {/* Header */}
        <div className="border-b border-green-400/30 pb-3 md:pb-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-1">SYSTEM_ID: NeiKos496</div>
          <h1 className="text-xl md:text-2xl">Scepter δ-me13</h1>
          <div className="text-xs text-green-400/60 mt-1">INIT: 2025-10-12T23:30:00+07:00</div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6 font-mono text-sm">
          <div className="border border-green-400/30 p-4">
            <div className="text-green-400/60 text-xs mb-2">RUNTIME</div>
            <div className="text-xl">{formatTime(elapsedSeconds)}</div>
            <div className="text-xs text-green-400/60 mt-1">D:H:M:S</div>
          </div>
          
          <div className="border border-green-400/30 p-4">
            <div className="text-green-400/60 text-xs mb-2">CYCLE_COUNT</div>
            <div className="text-xl">{totalCount.toLocaleString()}</div>
            <div className="text-xs text-green-400/60 mt-1">{progressPercent}% / TARGET: {GOAL.toLocaleString()}</div>
          </div>
          
          <div className="border border-green-400/30 p-4">
            <div className="text-green-400/60 text-xs mb-2">CYCLE_POSITION</div>
            <div className="text-xl">{formatVideoTime(currentVideoPosition)} / 4:47</div>
            <div className="text-xs text-green-400/60 mt-1">LOOP_#{completedLoops.toLocaleString()}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span>PROGRESS</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-green-400/10 h-4 border border-green-400/30">
            <div 
              className="h-full bg-green-400/50 transition-all duration-1000"
              style={{ width: `${Math.min(100, (totalCount / GOAL) * 100)}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs">STATUS:</span>
            <span className={`text-sm ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
              [{isPlaying ? 'RUNNING' : 'PAUSED'}]
            </span>
          </div>
        </div>

        {/* Fetching Status */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 flex items-center gap-2">
            <span className="inline-block w-3 font-[ui-monospace,monospace] tracking-tight">{spinnerFrames[spinnerIndex]}</span>
            <span>FETCHING DATA:</span>
            <a href="https://www.youtube.com/watch?v=xQbetWZS-zs" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors underline truncate">
              Honkai: Star Rail - Animated Short "Hark! There's Revelry Atop the Divine Mountain"
            </a>
          </div>
        </div>

        {/* Primary Video Player */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">PRIMARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20 relative">
            <video
              ref={videoRef}
              className="w-full h-full"
              loop
              playsInline
              preload="auto"
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src="/phainon.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Primary Audio Controls */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400/60">PRIMARY AUDIO:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const video = videoRef.current;
                if (video && videoFullyLoaded) {
                  const newMuteState = !video.muted;
                  video.muted = newMuteState;
                  userMutePreference.current = newMuteState; // Save user preference
                  setIsMuted(newMuteState);
                }
              }}
              disabled={!videoFullyLoaded}
              className="text-green-400 hover:text-green-300 transition-colors border border-green-400/30 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMuted ? '[MUTE]' : '[ON]'}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-green-400/60">VOL:</span>
              <div 
                className="flex-1 max-w-xs h-4 border border-green-400/30 bg-black relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!videoFullyLoaded) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const video = videoRef.current;
                  if (video) {
                    video.volume = percent / 100;
                    userVolumePreference.current = percent; // Save user preference
                    setVolume(percent);
                    if (percent > 0 && video.muted) {
                      video.muted = false;
                      userMutePreference.current = false; // Save user preference
                      setIsMuted(false);
                    }
                  }
                }}
              >
                <div 
                  className="h-full bg-green-400/50 transition-all duration-100"
                  style={{ width: `${volume}%` }}
                />
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-[10px] text-green-400 font-bold pointer-events-none">
                  {volume}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Video Player */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">SECONDARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20 relative">
            {isSecondaryWaiting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center">
                  <div className="text-green-400 text-sm mb-2">
                    {spinnerFrames[spinnerIndex]} WAITING FOR CYCLE RESET
                  </div>
                  <div className="text-green-400/60 text-xs">
                    Restarting at 0:00 ({formatVideoTime(VIDEO_DURATION - currentVideoPosition)} remaining)
                  </div>
                </div>
              </div>
            )}
            <video
              ref={secondaryVideoRef}
              className="w-full h-full"
              playsInline
              preload="auto"
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src="/companion.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="text-xs text-green-400/60 mt-2">
            DURATION: 3:24 | POSITION: {formatVideoTime(secondaryVideoPosition)} | 
            STATUS: {isSecondaryWaiting ? 'WAITING' : (secondaryIsPlaying ? 'PLAYING' : 'PAUSED')}
          </div>
        </div>

        {/* Secondary Audio Controls */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400/60">SECONDARY AUDIO:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const video = secondaryVideoRef.current;
                if (video && secondaryVideoFullyLoaded) {
                  const newMuteState = !video.muted;
                  video.muted = newMuteState;
                  secondaryUserMutePreference.current = newMuteState; // Save user preference
                  setSecondaryIsMuted(newMuteState);
                }
              }}
              disabled={!secondaryVideoFullyLoaded}
              className="text-green-400 hover:text-green-300 transition-colors border border-green-400/30 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryIsMuted ? '[MUTE]' : '[ON]'}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-green-400/60">VOL:</span>
              <div 
                className="flex-1 max-w-xs h-4 border border-green-400/30 bg-black relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!secondaryVideoFullyLoaded) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const video = secondaryVideoRef.current;
                  if (video) {
                    video.volume = percent / 100;
                    secondaryUserVolumePreference.current = percent; // Save user preference
                    setSecondaryVolume(percent);
                    if (percent > 0 && video.muted) {
                      video.muted = false;
                      secondaryUserMutePreference.current = false; // Save user preference
                      setSecondaryIsMuted(false);
                    }
                  }
                }}
              >
                <div 
                  className="h-full bg-green-400/50 transition-all duration-100"
                  style={{ width: `${secondaryVolume}%` }}
                />
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-[10px] text-green-400 font-bold pointer-events-none">
                  {secondaryVolume}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of 100 Instances */}
        <div className="border border-green-400/30 p-4">
          <div className="text-xs text-green-400/60 mb-3">PARALLEL_INSTANCES [100x] - LIVE FEED</div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                className="aspect-square relative border border-green-400/30 overflow-hidden bg-black"
              >
                <canvas
                  ref={el => canvasRefs.current[i] = el}
                  width="120"
                  height="120"
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-green-400/60 mt-3">MULTIPLIER: x100 per cycle | STREAM: SYNCHRONIZED</div>
        </div>

        {/* Footer */}
        <div className="border-t border-green-400/30 mt-4 md:mt-6 pt-4 text-xs text-green-400/60 text-center">
          <div>SYSTEM OPERATIONAL | TIME_SYNC: ACTIVE | AUTO_INCREMENT: ENABLED</div>
        </div>
      </div>
    </div>
  );
};

export default PhainonShrine;