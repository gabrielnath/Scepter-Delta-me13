import React, { useState, useEffect, useRef } from 'react';

const PhainonShrine = () => {
  // Hardcoded start: Oct 12, 2025, 11:30 PM GMT+7
  const START_TIME = new Date('2025-10-12T23:30:00+07:00').getTime();
  const VIDEO_DURATION = 288; // 4:48 in seconds
  const GRID_SIZE = 100;
  const GOAL = 33550336;
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
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

  // Draw video frames to canvases
  const drawVideoFrames = () => {
    if (!playerRef.current || !playerRef.current.getIframe) return;

    canvasRefs.current.forEach((canvas, index) => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        try {
          // Simple grayscale gradient with subtle animation
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          const intensity = (Math.sin(Date.now() / 1000 + index * 0.1) + 1) / 2;
          const gray = Math.floor(intensity * 100 + 50);
          gradient.addColorStop(0, `rgb(${gray}, ${gray}, ${gray})`);
          gradient.addColorStop(1, `rgb(${gray - 30}, ${gray - 30}, ${gray - 30})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch (e) {
          ctx.fillStyle = '#444444';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    animationRef.current = requestAnimationFrame(drawVideoFrames);
  };

  // YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: 'xQbetWZS-zs',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          loop: 1,
          playlist: 'xQbetWZS-zs',
          start: currentVideoPosition
        },
        events: {
          onReady: (event) => {
            event.target.seekTo(currentVideoPosition, true);
            event.target.playVideo();
            setIsPlaying(true);
            drawVideoFrames();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              if (!animationRef.current) {
                drawVideoFrames();
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Sync video position every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.seekTo) {
        const expectedPosition = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        const currentPos = playerRef.current.getCurrentTime();
        
        if (Math.abs(currentPos - expectedPosition) > 2) {
          playerRef.current.seekTo(expectedPosition, true);
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
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

        {/* Video Player */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">PRIMARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20">
            <div id="youtube-player" className="w-full h-full"></div>
          </div>
        </div>

        {/* Grid of 100 Instances */}
        <div className="border border-green-400/30 p-4">
          <div className="text-xs text-green-400/60 mb-3">PARALLEL_INSTANCES [100x]</div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                className="aspect-square relative border border-green-400/20 overflow-hidden"
              >
                <canvas
                  ref={el => canvasRefs.current[i] = el}
                  width="60"
                  height="60"
                  className="w-full h-full"
                />
                <div className="absolute top-0 left-0 text-[8px] text-green-400/40 bg-black/80 px-1">
                  {i.toString().padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-green-400/60 mt-3">MULTIPLIER: x100 per cycle</div>
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