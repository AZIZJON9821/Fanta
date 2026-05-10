"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

// Use ImageBitmap for GPU-accelerated rendering — 10x faster than HTMLImageElement
const GPU_CACHE = new Map<string, ImageBitmap[]>();
const LOADING_STATE = new Map<string, "loading" | "done">();

const FLAVOR_MAP: Record<string, string> = {
  "Apelsin": "Apelsin",
  "Marakuya": "Marakuya",
  "Qulupnay": "Qulupnay",
  "Chernika & Malina": "Chernika&Malina",
  "Siyohrang Chernika": "SiyohrangCHernika"
};

const flavorsList = Object.keys(FLAVOR_MAP);

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({
  flavor,
  frameCount,
  onAutoNext,
  mode = "full",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(GPU_CACHE.has(flavor));
  const [mounted, setMounted] = useState(false);

  const animRef = useRef({
    frame: mode === "wiggle" ? frameCount - 1 : 0,
    idle: 0,
    lastDrawn: -1,
    destroyed: false,
    // Layout cache - recalculate only on resize
    w: 0,
    h: 0,
    scale: 1,
    ox: 0,
    oy: 0,
    srcW: 0,
    srcH: 0,
  });

  // Mount check
  useEffect(() => {
    setMounted(true);
    return () => { animRef.current.destroyed = true; };
  }, []);

  // GPU-Accelerated Preloader using createImageBitmap
  useEffect(() => {
    if (!mounted) return;

    let active = true;

    const loadFlavor = async (f: string) => {
      if (GPU_CACHE.has(f)) {
        if (f === flavor && active) setIsReady(true);
        return;
      }
      if (LOADING_STATE.get(f) === "loading") return;

      LOADING_STATE.set(f, "loading");
      const bitmaps: ImageBitmap[] = new Array(frameCount);
      const folder = FLAVOR_MAP[f];

      // Load in parallel batches for speed
      const batchSize = f === flavor ? 20 : 8;

      for (let i = 0; i < frameCount; i += batchSize) {
        if (!active) break;

        const end = Math.min(i + batchSize, frameCount);
        const batch = Array.from({ length: end - i }, (_, j) => {
          const idx = i + j;
          const url = `/images/${folder}/ezgif-frame-${(idx + 1).toString().padStart(3, "0")}.jpg`;

          return fetch(url)
            .then(r => r.blob())
            .then(blob => createImageBitmap(blob))
            .then(bmp => { bitmaps[idx] = bmp; })
            .catch(() => {});
        });

        await Promise.all(batch);

        // After first 40 frames of current flavor, start animation
        if (f === flavor && i >= 20 && !GPU_CACHE.has(f) && active) {
          GPU_CACHE.set(f, bitmaps);
          setIsReady(true);
        }

        // Yield to browser to keep UI responsive
        await new Promise(r => setTimeout(r, 0));
      }

      GPU_CACHE.set(f, bitmaps);
      LOADING_STATE.set(f, "done");
    };

    const run = async () => {
      await loadFlavor(flavor);

      // Background load other flavors quietly
      if (mode === "full") {
        for (const f of flavorsList) {
          if (f !== flavor && active) {
            await new Promise(r => setTimeout(r, 3000));
            await loadFlavor(f);
          }
        }
      }
    };

    run();
    return () => { active = false; };
  }, [flavor, frameCount, mounted, mode]);

  // Canvas Rendering using native RAF + GSAP for animation state
  useEffect(() => {
    if (!isReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true, // Low-latency rendering
    });
    if (!ctx) return;

    // Reset state for new flavor/mode
    animRef.current.frame = mode === "wiggle" ? frameCount - 1 : 0;
    animRef.current.idle = 0;
    animRef.current.lastDrawn = -1;

    // Recalculate layout
    const calcLayout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const isMobile = window.innerWidth < 768;
      const limit = isMobile ? 1024 : 1600;

      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;
      if (w > limit) { h = h * (limit / w); w = limit; }

      canvas.width = w;
      canvas.height = h;

      // Store layout for the draw loop
      const bitmaps = GPU_CACHE.get(flavor);
      const first = bitmaps?.find(b => b);
      if (first) {
        animRef.current.srcW = first.width;
        animRef.current.srcH = first.height;
        animRef.current.scale = Math.max(w / first.width, h / first.height);
        animRef.current.ox = (w - first.width * animRef.current.scale) / 2;
        animRef.current.oy = (h - first.height * animRef.current.scale) / 2;
      }
      animRef.current.w = w;
      animRef.current.h = h;
    };

    // The draw function — called via RAF, ultra-fast
    const draw = () => {
      if (animRef.current.destroyed) return;

      const bitmaps = GPU_CACHE.get(flavor);
      if (!bitmaps) return;

      const raw = animRef.current.frame + animRef.current.idle;
      const idx = Math.round(Math.max(0, Math.min(frameCount - 1, raw)));

      if (idx === animRef.current.lastDrawn) return;

      // Smart fallback — find nearest valid bitmap
      let bmp = bitmaps[idx];
      if (!bmp) {
        for (let d = 1; d < 15; d++) {
          if (bitmaps[Math.max(0, idx - d)]) { bmp = bitmaps[Math.max(0, idx - d)]; break; }
          if (bitmaps[Math.min(frameCount - 1, idx + d)]) { bmp = bitmaps[Math.min(frameCount - 1, idx + d)]; break; }
        }
      }

      if (bmp) {
        const { scale, ox, oy } = animRef.current;
        ctx.drawImage(bmp, ox, oy, bmp.width * scale, bmp.height * scale);
        animRef.current.lastDrawn = idx;
      }
    };

    // RAF loop for buttery smooth rendering
    const rafLoop = () => {
      draw();
      rafRef.current = requestAnimationFrame(rafLoop);
    };

    // GSAP controls the animation STATE (not the draw)
    const tl = gsap.timeline();

    if (mode === "full") {
      tl.to(animRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
      });
      tl.to(animRef.current, {
        frame: frameCount - 18,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onComplete: () => onAutoNext?.()
      }, "-=0.1");
    } else {
      gsap.to(animRef.current, {
        frame: frameCount - 25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    gsap.to(animRef.current, {
      idle: 1.2,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    const onResize = () => { calcLayout(); };
    window.addEventListener("resize", onResize);
    calcLayout();
    rafRef.current = requestAnimationFrame(rafLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      tl.kill();
      gsap.killTweensOf(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [isReady, flavor, frameCount, mode, onAutoNext]);

  if (!mounted) return <div className="h-full w-full bg-black" />;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.8s ease",
          imageRendering: "auto",
        }}
      />
    </div>
  );
};
