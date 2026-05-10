"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

const GLOBAL_CACHE = new Map<string, HTMLImageElement[]>();
const GLOBAL_LOADING = new Map<string, boolean>();

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
  
  const [isReady, setIsReady] = useState(GLOBAL_CACHE.has(flavor));
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const stateRef = useRef({ 
    frame: mode === "wiggle" ? frameCount - 1 : 0,
    idle: 0,
    lastFrame: -1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDestroyed: false
  });

  useEffect(() => {
    setMounted(true);
    const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.01 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      stateRef.current.isDestroyed = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let active = true;
    const preload = async (f: string) => {
      if (GLOBAL_CACHE.has(f)) {
        if (f === flavor && active) setIsReady(true);
        return;
      }
      if (GLOBAL_LOADING.get(f)) return;
      
      GLOBAL_LOADING.set(f, true);
      const images: HTMLImageElement[] = [];
      const folder = FLAVOR_MAP[f];
      
      const loadChunk = async (start: number, end: number) => {
        const batch = Array.from({ length: end - start }).map((_, j) => {
          const idx = start + j;
          return new Promise((resolve) => {
            const img = new Image();
            img.src = `/images/${folder}/ezgif-frame-${(idx + 1).toString().padStart(3, "0")}.jpg`;
            img.onload = () => {
              images[idx] = img;
              if ("decode" in img) (img as any).decode().then(resolve).catch(resolve);
              else resolve(img);
            };
            img.onerror = resolve;
          });
        });
        await Promise.all(batch);
      };

      if (f === flavor) {
        // Load first 50 frames to ensure no flashing at start
        await loadChunk(0, 50);
        if (active) {
          GLOBAL_CACHE.set(f, images);
          setIsReady(true);
        }
      }

      const burstSize = 15;
      for (let i = (f === flavor ? 50 : 0); i < frameCount; i += burstSize) {
        if (!active || stateRef.current.isDestroyed) break;
        await loadChunk(i, Math.min(i + burstSize, frameCount));
        await new Promise(r => requestAnimationFrame(r));
      }

      GLOBAL_CACHE.set(f, images);
      GLOBAL_LOADING.set(f, false);
    };

    preload(flavor);
    return () => { active = false; };
  }, [flavor, frameCount, mounted]);

  useEffect(() => {
    if (!isReady || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = () => {
      if (!isVisible || stateRef.current.isDestroyed) return;
      const images = GLOBAL_CACHE.get(flavor);
      if (!images || images.length === 0) return;

      const raw = stateRef.current.frame + stateRef.current.idle;
      // SENIOR PRO FIX: Strict boundary and fallback to avoid flashing
      let idx = Math.round(raw);
      idx = Math.max(0, Math.min(frameCount - 1, idx));
      
      if (idx === stateRef.current.lastFrame) return;

      // Ensure the specific image exists before drawing to prevent white/black flickers
      let img = images[idx];
      
      // Fallback logic: if current frame is missing, try nearest loaded frame
      if (!img) {
        for (let offset = 1; offset < 10; offset++) {
          if (images[idx - offset]) { img = images[idx - offset]; break; }
          if (images[idx + offset]) { img = images[idx + offset]; break; }
        }
      }

      if (img && img.complete) {
        const { scale, offsetX, offsetY } = stateRef.current;
        // Don't clear rect, just draw over to keep it smooth
        ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
        stateRef.current.lastFrame = idx;
      }
    };

    const tl = gsap.timeline();
    if (mode === "full") {
      tl.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
        onUpdate: draw
      });
      tl.to(stateRef.current, {
        frame: frameCount - 18,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: draw,
        onComplete: () => onAutoNext?.()
      }, "-=0.1");
    } else {
      gsap.to(stateRef.current, {
        frame: frameCount - 25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: draw
      });
    }

    gsap.to(stateRef.current, {
      idle: 1.2,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: draw
    });

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      const limit = isMobile ? 1024 : 1600; 
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;
      if (w > limit) { h = h * (limit / w); w = limit; }
      canvas.width = w;
      canvas.height = h;
      stateRef.current.scale = Math.max(w / 1920, h / 1080);
      stateRef.current.offsetX = (w - 1920 * stateRef.current.scale) / 2;
      stateRef.current.offsetY = (h - 1080 * stateRef.current.scale) / 2;
      draw();
    };

    window.addEventListener("resize", resize);
    resize();
    gsap.ticker.add(draw);

    return () => {
      tl.kill();
      gsap.ticker.remove(draw);
      gsap.killTweensOf(stateRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isReady, flavor, frameCount, mode, isVisible, onAutoNext]);

  if (!mounted) return <div className="h-full w-full bg-black" />;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-700"
        style={{ 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto"
        }}
      />
    </div>
  );
};
