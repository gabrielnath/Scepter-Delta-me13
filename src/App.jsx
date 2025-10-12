import React, { useState, useEffect, useRef } from "react";

const PhainonShrine = () => {
  const START_TIME = new Date("2025-10-12T23:30:00+07:00").getTime();
  const VIDEO_DURATION = 288;
  const GRID_COLS = 10;
  const GRID_ROWS = 10;
  const GRID_SIZE = GRID_COLS * GRID_ROWS;
  const CELL_SIZE = 120; // can adjust for your layout
  const GOAL = 33550336;

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [canInteract, setCanInteract] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Calculate stats
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - START_TIME) / 1000));
  const completedLoops = Math.floor(elapsedSeconds / VIDEO_DURATION);
  const currentVideoPosition = elapsedSeconds % VIDEO_DURATION;
  const totalCount = completedLoops * GRID_SIZE;
  const progressPercent = ((totalCount / GOAL) * 100).toFixed(4);

  // Formatting helpers
  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days.toString().padStart(3, "0")}:${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Update stats once per second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Video setup (wait until video fully loaded)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onLoadedData() {
      setVideoLoaded(true);
      video.currentTime = currentVideoPosition;
      // Only allow play button when fully loaded
      setCanInteract(true);
    }

    function onPlay() { setIsPlaying(true); }
    function onPause() { setIsPlaying(false); }

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.load();

    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentVideoPosition]);

  // Sync video time every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && videoLoaded) {
        const expectedPosition = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        if (Math.abs(video.currentTime - expectedPosition) > 2) {
          video.currentTime = expectedPosition;
        }
      }
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [videoLoaded]);

  // Draw video to 100 grid cells on 1 canvas
  useEffect(() => {
    let stop = false;
    function drawGrid() {
      if (stop) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !video || !videoLoaded || !isPlaying) {
        animationRef.current = requestAnimationFrame(drawGrid);
        return;
      }

      const ctx = canvas.getContext("2d");
      // Big clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const idx = row * GRID_COLS + col;
          const x = col * CELL_SIZE;
          const y = row * CELL_SIZE;
          // Draw scaled video frame
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
            x, y, CELL_SIZE, CELL_SIZE);

          // Overlay tint
          ctx.save();
          ctx.fillStyle = "rgba(34,197,94,.08)";
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

          // Overlay box & ID
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(x, y, 30, 12);
          ctx.fillStyle = "#22c55e";
          ctx.font = "9px monospace";
          ctx.textAlign = "start";
          ctx.textBaseline = "top";
          ctx.fillText(idx.toString().padStart(3, "0"), x + 2, y + 2);
          ctx.restore();
        }
      }
      animationRef.current = requestAnimationFrame(drawGrid);
    }

    animationRef.current = requestAnimationFrame(drawGrid);
    return () => {
      stop = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [videoLoaded, isPlaying]);

  // Play button, only active after video 100% loaded
  const handlePlayClick = () => {
    if (canInteract && videoRef.current) videoRef.current.play();
  };

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
            <div className="flex items-center gap-3">
              <span className={`text-sm ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
                [{isPlaying ? 'RUNNING' : 'PAUSED'}]
              </span>
              {!isPlaying && (
                <button 
                  onClick={handlePlayClick}
                  disabled={!canInteract}
                  className={`text-xs border border-green-400/50 px-3 py-1 transition-colors ${
                    canInteract ? "hover:bg-green-400/10" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  START
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video player (source only, not displayed) */}
        <video
          ref={videoRef}
          className="hidden"
          loop
          playsInline
          crossOrigin="anonymous"
        >
          <source src="/phainon.mp4" type="video/mp4" />
        </video>
        {!videoLoaded && (
          <div className="text-xs text-yellow-400 mb-2 text-center">
            LOADING VIDEO... (Make sure phainon.mp4 is in /public folder)
          </div>
        )}

        {/* Single master canvas grid (10x10) */}
        <div className="border border-green-400/30 p-4">
          <div className="text-xs text-green-400/60 mb-3">PARALLEL_INSTANCES [100x] - LIVE FEED</div>
          <div
            style={{
              width: GRID_COLS * CELL_SIZE,
              height: GRID_ROWS * CELL_SIZE,
              border: "1px solid #22c55e40",
              maxWidth: "100%",
              margin: "0 auto"
            }}
          >
            <canvas
              ref={canvasRef}
              width={GRID_COLS * CELL_SIZE}
              height={GRID_ROWS * CELL_SIZE}
              style={{
                width: "100%",
                height: "auto",
                display: "block"
              }}
              tabIndex={-1}
            />
          </div>
          <div className="text-xs text-green-400/60 mt-3">
            MULTIPLIER: x100 per cycle | STREAM: SYNCHRONIZED
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-green-400/30 mt-4 md:mt-6 pt-4 text-xs text-green-400/60 text-center">
          <div className="break-words">
            SYSTEM OPERATIONAL | TIME_SYNC: ACTIVE | AUTO_INCREMENT: ENABLED
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhainonShrine;
