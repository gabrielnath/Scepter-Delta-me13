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
  const [isSecondaryFinished, setIsSecondaryFinished] = useState(false);

  // Audio states
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isSecondaryMuted, setIsSecondaryMuted] = useState(true);
  const [secondaryVolume, setSecondaryVolume] = useState(100)

  // Fetching spinner
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const secondaryVideoRef = useRef(null);
  const canvasRefs = useRef([]);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);
  const observerRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  // Detect if mobile device (for performance optimization)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const canvasFPS = isMobile ? 20 : 60; // Lower FPS on mobile
  const canvasSize = isMobile ? 80 : 160; // Smaller canvas on mobile

  // Calculate elapsed time and stats
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - START_TIME) / 1000));
  const completedLoops = Math.floor(elapsedSeconds / VIDEO_DURATION);
  const currentVideoPosition = elapsedSeconds % VIDEO_DURATION;
  const totalCount = completedLoops * GRID_SIZE;
  const progressPercent = ((totalCount / GOAL) * 100).toFixed(4);

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

  // Update current time every 80 miliseconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
      setSpinnerIndex(prev => (prev + 1) % spinnerFrames.length);
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Draw video to all 100 canvases - optimized version
  const drawVideoFrames = () => {
    const video = videoRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    
    // Check if we can draw & check offscreen canvas
    if (!video || video.paused || video.ended || video.readyState < 3 || !offscreenCanvas) {
      animationRef.current = requestAnimationFrame(drawVideoFrames);
      return;
    }

    const offCtx = offscreenCanvas.getContext('2d');

    // Draw the video frame to offscreen canvas
    offCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Add green tint
    offCtx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw to all canvases
    canvasRefs.current.forEach((canvas, index) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // Draw from offscreen canvas (fast copy to all canvases)
      ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
      
      // Add instance ID
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 35, 15);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(index.toString().padStart(3, '0'), 3, 12); // Instance ID
    });

    // Mobile optimization - throttle frame rate
    const delay = 1000 / canvasFPS;
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(drawVideoFrames);
    }, delay);
  };

  // Setup video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log('Video metadata loaded');
      setVideoLoaded(true);
    };

    const handleCanPlayThrough = () => {
      console.log('Video fully loaded and can play through');
      setVideoFullyLoaded(true);
      // Initial position and muted state for PRIMARY
      if (video.currentTime === 0) {
        video.currentTime = currentVideoPosition;
        video.muted = true;
        video.volume = 1.0;
        setIsMuted(true);
        setVolume(100);
      }
      // Auto-start playing
      video.play().then(() => {
        console.log('Autoplay successful');
        secondaryVideoRef.current?.play().catch(() => {});
      }).catch((e) => {
        console.log('Autoplay failed:', e);
      });
    };

    // --- CONSOLIDATED AND CORRECTED TIME SYNC LOGIC ---
    const handleTimeUpdate = () => {
      const video = videoRef.current;
      const secondaryVideo = secondaryVideoRef.current;

      if (!video || !secondaryVideo || video.readyState < 1 || secondaryVideo.readyState < 1) return;

      const primaryTime = video.currentTime;
      const secondaryShouldBePlaying = primaryTime < SECONDARY_VIDEO_DURATION;

      // === CONTINUOUS SYNCHRONIZATION (Master Sync) ===
      if (secondaryVideo.readyState >= 3) {
        // The secondary video's effective time is the primary time modulo its own duration.
        const targetSecondaryTime = primaryTime % SECONDARY_VIDEO_DURATION; 
        
        const timeDifference = Math.abs(secondaryVideo.currentTime - targetSecondaryTime);

        // Only seek if the difference is more than 0.2s (to prevent excessive seeking/flickering)
        if (timeDifference > 0.2) {
          secondaryVideo.currentTime = targetSecondaryTime;
        }
      }

      // === SECONDARY VIDEO STATE & PLAYBACK LOGIC ===
      if (secondaryShouldBePlaying) {
        // Case A: Primary is running and Secondary should be playing
        if (isSecondaryFinished) {
          setIsSecondaryFinished(false); // Hide the [WAITING...] overlay
        }
        
        // Sync play/pause state
        if (video.paused && !secondaryVideo.paused) {
          secondaryVideo.pause();
        } else if (!video.paused && secondaryVideo.paused) {
          secondaryVideo.play().catch(() => {});
        }
      } else {
        // Case B: Primary time is beyond Secondary duration (Secondary should be done)
        if (!isSecondaryFinished) {
          secondaryVideo.pause();
          // Reset currentTime to 0 to show the poster frame and look 'blank'
          secondaryVideo.currentTime = 0; 
          setIsSecondaryFinished(true); // Show the [WAITING...] overlay
          console.log('Secondary video finished, waiting for primary loop.');
        }
      }

      // PRIMARY VIDEO LOOP LOGIC (The cycle reset)
      if (primaryTime >= VIDEO_DURATION - 0.1) {
        // Reset time for loop
        video.currentTime = 0;

        // Ensure play is called to restart everything correctly
        video.play().catch(() => {});
        secondaryVideo.play().catch(() => {});
        
        // New cycle started, hide "Waiting" message
        setIsSecondaryFinished(false); 
        console.log('Primary video looped, restarting both videos.');
      }
    };
    // --- END OF CONSOLIDATED TIME SYNC LOGIC ---

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
      console.log('Video playing - starting canvas draw');
      setIsPlaying(true);
      if (!animationRef.current) {
        drawVideoFrames();
      }
    };

    const handlePause = () => {
      console.log('Video paused');
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('timeupdate', handleTimeUpdate);

    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentVideoPosition, VIDEO_DURATION, SECONDARY_VIDEO_DURATION, isSecondaryFinished, isPlaying]); // Added dependencies for the effect to work correctly

  // Sync and setup for Secondary Video
  useEffect(() => {
    const primaryVideo = videoRef.current;
    const secondaryVideo = secondaryVideoRef.current;

    if (!primaryVideo || !secondaryVideo) return;

    // Initial setup for secondary video
    secondaryVideo.muted = isSecondaryMuted;
    secondaryVideo.volume = secondaryVolume / 100;

    // --- INITIAL SYNC ON LOAD (Fixes the refresh issue) ---
    const initialSync = () => {
        const targetTime = primaryVideo.currentTime % SECONDARY_VIDEO_DURATION;
        secondaryVideo.currentTime = targetTime;
        
        // Apply the waiting logic on load if primary video is already past the secondary's duration
        if (primaryVideo.currentTime >= SECONDARY_VIDEO_DURATION) {
            setIsSecondaryFinished(true);
            secondaryVideo.pause();
        }
    };
    
    // Attempt sync right away if videos are ready (for fast refresh)
    if (primaryVideo.readyState >= 1 && secondaryVideo.readyState >= 1) {
        initialSync();
    }
    
    // Use the loadeddata listener to catch when it's ready (for slow network/first load)
    secondaryVideo.addEventListener('loadeddata', initialSync);
    
    const handleVolumeChange = () => {
      // Update local state if volume is changed externally (e.g. browser control)
      setIsSecondaryMuted(secondaryVideo.muted);
      setSecondaryVolume(Math.round(secondaryVideo.volume * 100));
    };

    secondaryVideo.addEventListener('volumechange', handleVolumeChange);

    // Initial play attempt (for mobile/autoplay, will be overridden by timeupdate sync)
    secondaryVideo.play().catch(() => {});

    return () => {
      secondaryVideo.removeEventListener('loadeddata', initialSync);
      secondaryVideo.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [isSecondaryMuted, secondaryVolume, SECONDARY_VIDEO_DURATION]);


  // Update primary video volume controls
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume / 100;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Intersection Observer to pause canvas drawing when not visible
  useEffect(() => {
    const gridContainer = document.querySelector('[data-grid-container]');
    if (!gridContainer) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && animationRef.current) {
            // Grid scrolled out of view - cancel animation
            console.log('Grid out of view - pausing canvas drawing');
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          } else if (entry.isIntersecting && !animationRef.current && isPlaying) {
            // Grid back in view - resume animation
            console.log('Grid in view - resuming canvas drawing');
            drawVideoFrames();
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    observerRef.current.observe(gridContainer);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isPlaying]);

  // Sync video position every 10 seconds (time drift correction)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && videoLoaded) {
        const expectedPosition = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        const currentPos = video.currentTime;
        
        // If drift is more than 2 seconds, resync
        if (Math.abs(currentPos - expectedPosition) > 2) {
          video.currentTime = expectedPosition;
        }
        
        // Auto-restart if paused (to keep sync) -- in case autoplay was interrupted
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [videoLoaded]);

  // Handle user click to enable autoplay
  const handleInteraction = () => {
    const video = videoRef.current;
    const secondaryVideo = secondaryVideoRef.current;

    if (video && video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }

    if (secondaryVideo && secondaryVideo.paused) {
      secondaryVideo.play().catch(() => {});
    }
  };

  // Offscreen Canvas Initialization
  useEffect(() => {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasSize;
      offscreenCanvas.height = canvasSize;
      offscreenCanvasRef.current = offscreenCanvas;
      
      console.log(`Offscreen canvas initialized at size: ${canvasSize}x${canvasSize}`);

      // Cleanup
      return () => {
          offscreenCanvasRef.current = null;
      };
  }, [canvasSize]);

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
                <span>LOADING VIDEO DATA</span>
                <span>{loadProgress}%</span>
              </div>
              <div className="w-full bg-green-400/10 h-4 border border-green-400/30">
                <div 
                  className="h-full bg-green-400/50 transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
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

        {/* Fetching Status - Separate Tab */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 flex items-center gap-2">
            <span className="inline-block w-3 font-[ui-monospace,monospace] tracking-tight">{spinnerFrames[spinnerIndex]}</span>
            <span>FETCHING DATA:</span>
            <a href="https://www.youtube.com/watch?v=xQbetWZS-zs" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors underline truncate">
              Honkai: Star Rail - Animated Short "Hark! There's Revelry Atop the Divine Mountain"
            </a>
          </div>
        </div>

        {/* Video Player - Primary (Phainon) */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">PRIMARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20 relative">
            <video
              ref={videoRef}
              className="w-full h-full"
              playsInline
              preload="auto"
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src="/phainon.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Video Player - Secondary (Friend) */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">SECONDARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20 relative">

              {isSecondaryFinished && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <span className="text-sm md:text-xl text-yellow-400 animate-pulse">
                        [WAITING FOR CYCLE TO END]
                    </span>
                </div>
              )}

            <video
              ref={secondaryVideoRef}
              className={`w-full h-full ${isSecondaryFinished ? 'opacity-20' : ''}`} 
              playsInline
              preload="auto"
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src="/companion.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="text-xs text-green-400/40 mt-2">
            ⚠ Synced to primary stream
          </div>
        </div>

        {/* Audio Controls - Primary Video */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">AUDIO_CONTROLS [PRIMARY]</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400/60">MUTE:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(prev => {
                  const newMuted = !prev;
                  videoRef.current.muted = newMuted;
                  return newMuted;
                });
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
                  if (!videoFullyLoaded) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  setVolume(percent);
                  const video = videoRef.current;
                  if (video) {
                    video.volume = percent / 100;
                    if (percent > 0) {
                    video.muted = false;
                    setIsMuted(false);
                    }
                  }
                }}
              >
                <div 
                  className="h-full bg-green-400/50 transition-all duration-100"
                  style={{ width: `${volume}%` }}
                />
                <div 
                  className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-[10px] text-green-400 font-bold pointer-events-none">
                  {volume}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Controls - Secondary Video */}
        <div className="border border-green-400/30 p-3 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">AUDIO_CONTROLS [SECONDARY]</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400/60">MUTE:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSecondaryMuted(prev => {
                  const newMuted = !prev;
                  secondaryVideoRef.current.muted = newMuted;
                  return newMuted;
                });
              }}
              disabled={!videoFullyLoaded}
              className="text-green-400 hover:text-green-300 transition-colors border border-green-400/30 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSecondaryMuted ? '[MUTE]' : '[ON]'}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-green-400/60">VOL:</span>
              <div 
                className="flex-1 max-w-xs h-4 border border-green-400/30 bg-black relative cursor-pointer"
                onClick={(e) => {
                  if (!videoFullyLoaded) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  setSecondaryVolume(percent);
                  const secondaryVideo = secondaryVideoRef.current;
                  if (secondaryVideo) {
                    secondaryVideo.volume = percent / 100;
                    if (percent > 0) {
                      secondaryVideo.muted = false;
                      setIsSecondaryMuted(false);
                    }
                  }
                }}
              >
                <div 
                  className="h-full bg-green-400/50 transition-all duration-100"
                  style={{ width: `${secondaryVolume}%` }}
                />
                <div 
                  className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-[10px] text-green-400 font-bold pointer-events-none"
                >
                  {secondaryVolume}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of 100 Instances */}
        <div className="border border-green-400/30 p-4" data-grid-container>
          <div className="text-xs text-green-400/60 mb-3">PARALLEL_INSTANCES [100x] - LIVE FEED</div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                className="aspect-square relative border border-green-400/30 overflow-hidden bg-black"
              >
                <canvas
                  ref={el => canvasRefs.current[i] = el}
                  width={canvasSize}
                  height={canvasSize}
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