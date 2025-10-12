import React, { useState, useEffect, useRef } from "react";

const PhainonShrine = () => {
  const START_TIME = new Date("2025-10-12T23:30:00+07:00").getTime();
  const VIDEO_DURATION = 288;
  const GRID_SIZE = 100;
  const GRID_COLS = 10;
  const GRID_ROWS = 10;
  const CANVAS_SIZE = 64; // Each instance is 64x64
  const GOAL = 33550336;

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef(null);
  const masterCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Derived values
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - START_TIME) / 1000));
  const completedLoops = Math.floor(elapsedSeconds / VIDEO_DURATION);
  const currentVideoPosition = elapsedSeconds % VIDEO_DURATION;
  const totalCount = completedLoops * GRID_SIZE;
  const progressPercent = ((totalCount / GOAL) * 100).toFixed(4);

  const formatTime = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d.toString().padStart(3, "0")}:${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };
  const formatVideoTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // UI update loop (for stats/time)
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Efficient master-canvas grid drawing
  useEffect(() => {
    let stop = false;
    const canvas = masterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const drawGrid = () => {
      if (!videoLoaded || !videoRef.current) return;
      for (let i = 0; i < GRID_SIZE; i++) {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = col * CANVAS_SIZE;
        const y = row * CANVAS_SIZE;
        ctx.clearRect(x, y, CANVAS_SIZE, CANVAS_SIZE);
        // Draw the video frame into each grid cell
        ctx.drawImage(videoRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE, x, y, CANVAS_SIZE, CANVAS_SIZE);
        // Overlays
        ctx.save();
        ctx.fillStyle = "rgba(34,197,94,.08)";
        ctx.fillRect(x, y, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x, y, 20, 12);
        ctx.fillStyle = "#22c55e";
        ctx.font = "9px monospace";
        ctx.fillText(i.toString().padStart(3, "0"), x + 2, y + 10);
        ctx.restore();
      }
    };

    // Animation loop: use requestVideoFrameCallback if supported
    let cleanupVideoFrameCallback = null;

    if (videoRef.current && "requestVideoFrameCallback" in videoRef.current) {
      const v = videoRef.current;
      function onFrame() {
        if (!stop && videoLoaded && isPlaying) {
          drawGrid();
          v.requestVideoFrameCallback(onFrame);
        }
      }
      v.requestVideoFrameCallback(onFrame);
      cleanupVideoFrameCallback = () => { /* auto stops */ };
    } else {
      // fallback for old browsers
      const renderLoop = () => {
        if (stop) return;
        if (videoLoaded && isPlaying) drawGrid();
        animationRef.current = requestAnimationFrame(renderLoop);
      };
      renderLoop();
      cleanupVideoFrameCallback = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }

    return () => {
      stop = true;
      cleanupVideoFrameCallback();
    };
  }, [videoLoaded, isPlaying]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoadedData = () => {
      setVideoLoaded(true);
      video.currentTime = currentVideoPosition;
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.load();
    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [currentVideoPosition]);

  // Periodically resync the video time
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && videoLoaded) {
        const expected = (Date.now() - START_TIME) / 1000 % VIDEO_DURATION;
        if (Math.abs(video.currentTime - expected) > 2)
          video.currentTime = expected;
      }
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [videoLoaded]);

  const handlePlayClick = () => {
    if (videoRef.current) videoRef.current.play();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="max-w-7xl mx-auto border border-green-400/30 p-4 md:p-6">
        {/* Header */}
        <div className="border-b border-green-400/30 pb-3 md:pb-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-1">
            SYSTEM_ID: PHAINON_FUNCTION_MONITOR_v1.0
          </div>
          <h1 className="text-xl md:text-2xl">FUNCTION EXECUTION TRACKER</h1>
          <div className="text-xs text-green-400/60 mt-1">
            INIT: 2025-10-12T23:30:00+07:00
          </div>
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
            <div className="text-xs text-green-400/60 mt-1">
              {progressPercent}% / TARGET: {GOAL.toLocaleString()}
            </div>
          </div>
          <div className="border border-green-400/30 p-4">
            <div className="text-green-400/60 text-xs mb-2">CYCLE_POSITION</div>
            <div className="text-xl">
              {formatVideoTime(currentVideoPosition)} / 4:48
            </div>
            <div className="text-xs text-green-400/60 mt-1">
              LOOP_#{completedLoops.toLocaleString()}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span>PROGRESS</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-green-400/10 h-4 border border-green-400/30">
            <div className="h-full bg-green-400/50 transition-all duration-1000"
              style={{ width: `${Math.min(100, (totalCount / GOAL) * 100)}%` }} />
          </div>
        </div>
        {/* Status */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs">STATUS:</span>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${isPlaying ? "text-green-400" : "text-yellow-400"}`}>[{isPlaying ? "RUNNING" : "PAUSED"}]</span>
              {!isPlaying && (
                <button
                  onClick={handlePlayClick}
                  className="text-xs border border-green-400/50 px-3 py-1 hover:bg-green-400/10 transition-colors"
                >
                  START
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Video player */}
        <div className="border border-green-400/30 p-4 mb-4 md:mb-6">
          <div className="text-xs text-green-400/60 mb-2">PRIMARY_STREAM</div>
          <div className="aspect-video bg-black border border-green-400/20">
            <video
              ref={videoRef}
              className="w-full h-full"
              loop
              playsInline
              controls
              crossOrigin="anonymous"
            >
              <source src="/phainon.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
          {!videoLoaded && (
            <div className="text-xs text-yellow-400 mt-2 text-center">
              LOADING VIDEO... (Make sure phainon.mp4 is in /public folder)
            </div>
          )}
          {videoLoaded && !isPlaying && (
            <div className="text-xs text-yellow-400 mt-2 text-center">
              Click PLAY on the video to start all 100 instances
            </div>
          )}
        </div>
        {/* Single master grid! */}
        <div className="border border-green-400/30 p-4">
          <div className="text-xs text-green-400/60 mb-3">
            PARALLEL_INSTANCES [100x] - LIVE FEED
          </div>
          <div
            style={{
              width: GRID_COLS * CANVAS_SIZE,
              height: GRID_ROWS * CANVAS_SIZE,
              border: "1px solid #22c55e40",
              maxWidth: "100%",
              margin: "0 auto"
            }}
          >
            <canvas
              ref={masterCanvasRef}
              width={GRID_COLS * CANVAS_SIZE}
              height={GRID_ROWS * CANVAS_SIZE}
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
