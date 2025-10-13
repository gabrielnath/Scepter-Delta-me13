import React, { useState, useEffect, useRef } from 'react';

const PhainonShrine = () => {
  // Hardcoded start: Oct 12, 2025, 11:30 PM GMT+7
  const START_TIME = new Date('2025-10-12T23:30:00+07:00').getTime();
  const VIDEO_DURATION = 287; // 4:47 in seconds
  const GRID_SIZE = 100;
  const GOAL = 33550336;
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFullyLoaded, setVideoFullyLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef(null);
  const canvasRefs = useRef([]);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);

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
    return `${days.toString().padStart(3, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current time every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Draw video to all 100 canvases - simplified version
  const drawVideoFrames = () => {
    const video = videoRef.current;
    
    // Check if we can draw
    if (!video || video.paused || video.ended || video.readyState < 3) {
      animationRef.current = requestAnimationFrame(drawVideoFrames);
      return;
    }

    // Draw to all canvases
    canvasRefs.current.forEach((canvas, index) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add green tint
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add instance ID
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 35, 15);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(index.toString().padStart(3, '0'), 3, 12);
    });

    animationRef.current = requestAnimationFrame(drawVideoFrames);
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
      // Set initial position once on load
      if (video.currentTime === 0) {
        video.currentTime = currentVideoPosition;
      }
      // Try to autoplay
      video.play().then(() => {
        console.log('Autoplay successful');
        setUserInteracted(true);
      }).catch((e) => {
        console.log('Autoplay blocked - user interaction required');
      });
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

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Sync video position every 10 seconds
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
        
        // Auto-restart if paused (to keep sync)
        if (video.paused && userInteracted) {
          video.play().catch(() => {});
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [videoLoaded, userInteracted]);

  // Handle manual play (for autoplay restrictions)
  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
    }
  };

  // Handle user click to enable autoplay
  const handleInteraction = () => {
    const video = videoRef.current;
    if (video && !userInteracted) {
      video.play().then(() => {
        setUserInteracted(true);
      });
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

      {/* Autoplay prompt overlay */}
      {videoFullyLoaded && !userInteracted && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center">
          <div className="border border-green-400 p-8 bg-black">
            <div className="text-center mb-4">
              <div className="text-xl mb-2">CLICK ANYWHERE TO START</div>
              <div className="text-xs text-green-400/60">Browser requires user interaction for autoplay</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto border border-green-400/30 p-4 md:p-6">
        
        {/* Header */}
        <div className="border-b border-green-400/30 pb-3 md:pb-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-1">SYSTEM_ID: PHAINON_FUNCTION_MONITOR_v1.0</div>
          <h1 className="text-xl md:text-2xl">FUNCTION EXECUTION TRACKER</h1>
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
            <div className="text-green-400/60 text-xs mb-2">EXECUTION_COUNT</div>
            <div className="text-xl">{totalCount.toLocaleString()}</div>
            <div className="text-xs text-green-400/60 mt-1">{progressPercent}% / TARGET: {GOAL.toLocaleString()}</div>
          </div>
          
          <div className="border border-green-400/30 p-4">
            <div className="text-green-400/60 text-xs mb-2">CYCLE_POSITION</div>
            <div className="text-xl">{formatVideoTime(currentVideoPosition)} / 4:48</div>
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

        {/* Video Player (hidden, no controls) */}
        <div className="hidden">
          <video
            ref={videoRef}
            loop
            playsInline
            preload="auto"
          >
            <source src="/phainon.mp4" type="video/mp4" />
          </video>
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
                  width="160"
                  height="160"
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-green-400/60 mt-3">MULTIPLIER: x100 per cycle | STREAM: SYNCHRONIZED</div>
        </div>

        {/* Footer */}
        <div className="border-t border-green-400/30 mt-4 md:mt-6 pt-4 text-xs text-green-400/60 text-center">
          <div className="break-words">SYSTEM OPERATIONAL | TIME_SYNC: ACTIVE | AUTO_INCREMENT: ENABLED</div>
        </div>
      </div>
    </div>
  );
};

export default PhainonShrine;