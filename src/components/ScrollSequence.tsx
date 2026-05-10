"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

// Global cache to avoid redundant loading across instances
const GLOBAL_CACHE: Record<string, HTMLImageElement[]> = {};
const LOADING_LOCKS: Record<string, boolean> = {};

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
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const stateRef = useRef({ 
    frame: mode === "wiggle" ? frameCount - 1 : 0,
    idle: 0,
    lastRenderedFrame: -1
  });

  // 1. Visibility Check
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.01 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Loading Logic - Fixed the "invisible next flavor" bug
  useEffect(() => {
    let isMounted = true;

    const preloadFlavor = async (f: string) => {
      // FIX: If already cached, just mark as ready and return
      if (GLOBAL_CACHE[f]) {
        if (f === flavor && isMounted) setIsReady(true);
        return;
      }

      if (LOADING_LOCKS[f]) {
        // If currently loading, wait for it or just check frequently
        const checkInterval = setInterval(() => {
          if (GLOBAL_CACHE[f]) {
            if (f === flavor && isMounted) setIsReady(true);
            clearInterval(checkInterval);
          }
        }, 100);
        return;
      }

      LOADING_LOCKS[f] = true;
      const images: HTMLImageElement[] = [];
      const folderName = FLAVOR_MAP[f];
      const chunkSize = 15; 

      for (let i = 0; i < frameCount; i += chunkSize) {
        if (!isMounted) break;

        const promises = Array.from({ length: Math.min(chunkSize, frameCount - i) }).map((_, j) => {
          const idx = i + j;
          return new Promise((resolve) => {
            const img = new Image();
            img.src = `/images/${folderName}/ezgif-frame-${(idx + 1).toString().padStart(3, "0")}.jpg`;
            img.onload = () => { images[idx] = img; resolve(img); };
            img.onerror = () => resolve(null);
          });
        });

        await Promise.all(promises);
        
        // Mark as ready once enough frames are in for the current flavor
        if (f === flavor && i >= 30 && isMounted) setIsReady(true);
        await new Promise(r => requestAnimationFrame(r));
      }
      
      GLOBAL_CACHE[f] = images;
      delete LOADING_LOCKS[f];
    };

    const run = async () => {
      await preloadFlavor(flavor);
      if (mode === "full") {
        for (const f of flavorsList) {
          if (f !== flavor && isMounted) {
            await new Promise(r => setTimeout(r, 2000));
            await preloadFlavor(f);
          }
        }
      }
    };

    run();
    return () => { isMounted = false; };
  }, [flavor, frameCount, mode]);

  // 3. Render and Animation
  useEffect(() => {
    if (!isReady || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const render = () => {
      if (!isVisible || !canvas) return;
      const images = GLOBAL_CACHE[flavor];
      if (!images) return;

      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      
      if (safeFrame === stateRef.current.lastRenderedFrame) return;
      
      const img = images[safeFrame];
      if (img && img.complete) {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        stateRef.current.lastRenderedFrame = safeFrame;
      }
    };

    const tl = gsap.timeline();

    if (mode === "full") {
      tl.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
        onUpdate: render,
      });

      tl.to(stateRef.current, {
        frame: frameCount - 18,
        duration: 1.2,
        repeat: 3,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: render,
        onComplete: () => onAutoNext?.()
      }, "-=0.1");
    } else {
      gsap.to(stateRef.current, {
        frame: frameCount - 25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: render,
      });
    }

    gsap.to(stateRef.current, {
      idle: 1.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      // CAP RESOLUTION: Fixed critical lag by capping canvas at 1080p
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;
      
      const maxW = 1920; 
      if (w > maxW) {
        h = h * (maxW / w);
        w = maxW;
      }

      canvas.width = w;
      canvas.height = h;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    gsap.ticker.add(render);

    return () => {
      tl.kill();
      gsap.ticker.remove(render);
      gsap.killTweensOf(stateRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady, flavor, frameCount, onAutoNext, mode, isVisible]);

  return (
    <div ref={containerRef} className="sticky top-0 h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ 
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
          filter: mode === "wiggle" ? "contrast(1.02)" : "contrast(1.05) brightness(1.05)",
        }}
      />
      {mode === "full" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      )}
    </div>
  );
};
