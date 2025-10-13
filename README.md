# Scepter δ-me13

> _“A thousand mirrors, one reflection.”_  
> _A synchronized experiment in time, memory, and motion._

---

## 🧩 Overview

**Scepter δ-me13** is a fan-made, synchronized visual project built with **React**.  
It continuously loops a preloaded video file across 100 live canvas instances — all synchronized by global time, creating a grid of parallel reflections.  

The system uses:

- Frame-accurate synchronization across devices via real-time timestamps  
- 100 mirrored video instances rendered to `<canvas>` with subtle tinting  
- A smooth Unicode spinner animation for system feedback  
- A real-time progress and cycle tracker  
- Volume and mute control, while restricting all playback manipulation

The entire loop is autonomous — users can’t skip, pause, or rewind.  
It’s an homage to continuity, impermanence, and visual rhythm.

---

## ⚙️ Tech Stack

- **React**
- **TailwindCSS** (for aesthetic terminal-like styling)
- **HTML5 Canvas**
- **Custom JS Sync Logic** using system time and requestAnimationFrame

---

## 🚀 Features

| Feature | Description |
|----------|--------------|
| 🔁 **Global Sync** | All users see the same frame based on a fixed start timestamp. |
| 🎞️ **Canvas Rendering** | 100 synchronized canvases, each with an instance ID overlay. |
| ⏱️ **Time Display** | Displays runtime, loop count, and cycle position in real time. |
| 🔊 **Volume-Only Control** | Users can change volume but cannot pause, skip, or download. |
| ⚡ **Spinner Animation** | Smooth Unicode-based spinner synced at 80 ms intervals. |
| 🧮 **Progress Counter** | Auto-incrementing virtual counter tied to loop duration. |

---

## 📜 Credits

> **Video Asset:**  
> _“Animated Short "Hark! There's Revelry Atop the Divine Mountain" | Honkai: Star Rail”_  
> © HoYoverse. All rights reserved.

The original video can be viewed on YouTube:  
[https://www.youtube.com/watch?v=xQbetWZS-zs](https://www.youtube.com/watch?v=xQbetWZS-zs)

---

## ⚠️ Legal Notice

This project is **a non-commercial fan work**.  
It is **not affiliated with, endorsed by, or connected to HoYoverse or miHoYo** in any way.

The video asset used here was **downloaded** solely for **personal, educational, and aesthetic purposes**.  
No revenue is generated from this project, and it should not be redistributed with copyrighted materials.

If you are a representative of HoYoverse and wish to request removal or modification,  
please contact the maintainer immediately.

---

## 🌐 Deployment

Phainon Shrine is built for static hosting (e.g. Vercel, Netlify).
The synchronization will automatically align regardless of timezone —
since the core logic relies on UTC timestamps, not local system time.

---

## 🪧 Disclaimer

All trademarks, logos, and visual materials are the property of their respective owners.
This is a fan-created, artistic experiment — made purely out of admiration for the craft and storytelling of Honkai: Star Rail and HoYoverse.

---

© 2025 Scepter δ-me13 — Fan-Project by gabrielnath