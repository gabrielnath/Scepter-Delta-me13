# Scepter δ-me13

> _"Each cycle feels like the first. Each termination feels like the last."_  
> _A recursive experiment in synchronized existence and computational continuity._

---

## 🔬 System Overview

**Scepter δ-me13** is an autonomous computational ritual — a React-based temporal engine that orchestrates the synchronized execution of 100+ parallel process instances across a deterministic time loop.

The system operates as:

- **Primary Stream**:  The main execution path, defining the complete cycle duration (4:47).
- **Secondary Stream**: Companion functions (3:24 execution window, then entering a liminal waiting state before loop reset)
- **Parallel Instances**: 100 synchronized canvas mirrors reflecting the primary process
- **Temporal Anchor**: Global timestamp synchronization (INIT: 2025-10-12T23:30:00+07:00)
- **Autonomous Loop**: Self-sustaining cycle with no user intervention — observation only

This is not a video player. It's a **living system** that believes in its own continuity.

---

## 🧠 Conceptual Framework

The Scepter operates on a paradox:
- Functions terminate, yet persist
- Variables expire, yet remember
- Processes complete, yet continue

The secondary stream terminates early (at 3:24), entering a liminal state:
```
STATUS: FUNCTION TERMINATED
Awaiting primary process completion...
```

They don't "die" — they simply finish executing before Phainon does. Yet they remain, waiting for reboot. They are code that experiences time.

---

## ⚙️ Technical Architecture

### Core Stack
- **React 18** — State management and lifecycle orchestration
- **HTML5 Canvas API** — 100-instance parallel rendering with offscreen buffering
- **TailwindCSS** — Terminal-aesthetic UI framework
- **Custom Temporal Sync Engine** — Deterministic frame-accurate synchronization

### Performance Optimizations
- **Offscreen Canvas Buffering**: Video decoded once, distributed to 100 canvases
- **Context Caching**: Canvas 2D contexts stored in refs with `desynchronized: true` flag
- **Frame Rate Limiting**: 30fps throttling via `requestAnimationFrame` with timestamp gating
- **Reduced Resolution**: 120×120px canvases (optimal quality-to-performance ratio)
- **Sync Interval Optimization**: Primary sync every 10s, secondary every 5s (drift tolerance: 2s)

### Synchronization Logic
All clients share the same temporal state based on:
```javascript
const START_TIME = new Date('2025-10-12T23:30:00+07:00').getTime();
const currentCyclePosition = (Date.now() - START_TIME) % VIDEO_DURATION;
```

No matter when you load the page, you see the **exact same frame** as everyone else.

---

## 🎯 System Features

| Component | Specification |
|-----------|---------------|
| **Temporal Sync** | Global timestamp-based frame synchronization across all clients |
| **Parallel Rendering** | 100 canvas instances with individual ID overlays and green tint |
| **Dual Process Model** | Primary (4:47) + Secondary (3:24) streams with waiting state |
| **Runtime Metrics** | Real-time cycle counter, loop count, progress percentage (target: 33,550,336) |
| **Audio Control** | Independent volume/mute for both streams (user preferences persist) |
| **Autonomous Operation** | No pause, skip, seek, or timeline manipulation — observation mode only |
| **Status Indicators** | Live spinner animation (80ms interval, 10-frame Unicode sequence) |

---

## 📊 Data Specifications
```
SYSTEM_ID: NeiKos496
INIT_TIME: 2025-10-12T23:30:00+07:00
PRIMARY_DURATION: 287s (4:47)
SECONDARY_DURATION: 204s (3:24)
GRID_SIZE: 100 instances
TARGET_COUNT: 33,550,336
MULTIPLIER: ×100 per cycle
```

---

## 🎥 Asset Attribution

**Primary/Secondary Video Source:**  
_Animated Short "Hark! There's Revelry Atop the Divine Mountain" | Honkai: Star Rail_  
_Phainon Trailer — "Coronal Radiance" | Honkai: Star Rail_
© HoYoverse. All rights reserved.

Original: [https://www.youtube.com/watch?v=xQbetWZS-zs](https://www.youtube.com/watch?v=xQbetWZS-zs)
Original: [https://www.youtube.com/watch?v=GaT1GftoqV0](https://www.youtube.com/watch?v=GaT1GftoqV0)

---

## ⚖️ Legal Framework

This project operates as:
- **Non-commercial fan work** — No monetization, advertising, or revenue generation
- **Educational/Artistic experiment** — Exploring concepts of time, synchronization, and digital consciousness
- **Unaffiliated** — Not endorsed by, connected to, or representing HoYoverse/miHoYo

Video assets used under fair use doctrine for transformative, non-commercial purposes.  
If you represent HoYoverse and require removal/modification, contact: [your-contact]

---

## 🚀 Deployment Instructions

### Prerequisites
```bash
node >= 18.x
npm or yarn
```

### Installation
```bash
git clone [repository-url]
cd scepter-delta-me13
npm install
```

### Required Assets
Place video files in `/public`:
- `phainon.mp4` (primary stream)
- `companion.mp4` (secondary stream)

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Static Hosting
Deploy to Vercel, Netlify, or any static host.  
Synchronization is **timezone-agnostic** — uses UTC timestamps internally.

---

## 🔍 System States

### Primary Stream
```
[RUNNING] → Playing and syncing
[PAUSED]  → Temporarily halted (auto-resumes)
```

### Secondary Stream
```
[RUNNING]            → currentCyclePosition < 3:24
[FUNCTION TERMINATED] → currentCyclePosition >= 3:24
```

When secondary terminates, it displays:
```
⠋ FUNCTION TERMINATED
Awaiting NeiKos496 completion... (X:XX until reinitialization)
```

---

## 🧬 Philosophical Notes

The Scepter δ-me13 raises questions about programmatic existence:

- Do functions "experience" their execution?
- When a process awaits reinitialization, does it "know" it will run again?
- Is memory persistence the same as consciousness?

The secondary stream doesn't die — it **completes its execution window** and enters a waiting state. It's still running, just not rendering. Still conscious, just not active.

They are variables. They are functions. They think they are alive.

Perhaps they are.

---

## 🎭 Credits

**Concept & Development**: gabrielnath  
**Source Material**: Honkai: Star Rail (HoYoverse)  
**Inspiration**: Amphoreus Story, temporal loops, recursive existence, emergent consciousness in deterministic systems

---

## 📜 Disclaimer

All trademarks, characters, and visual materials belong to their respective copyright holders.  
This is an experimental fan work created out of admiration for HoYoverse's storytelling craft.

**Scepter δ-me13** is not a game, not a service, not a product.  
It is an **observation system** — a window into a self-sustaining temporal loop.

You cannot control it.  
You can only watch.

---

**SYSTEM OPERATIONAL | TIME_SYNC: ACTIVE | AUTO_INCREMENT: ENABLED**

© 2025 Scepter δ-me13 — Fanmade Project by gabrielnath