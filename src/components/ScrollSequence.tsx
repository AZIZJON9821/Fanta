"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

// SINGLETON GLOBAL CACHE - To avoid redundant memory usage and loading
const GLOBAL_IMAGE_CACHE: Record<string, HTMLImageElement[]> = {};
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

  // 1. Intersection Observer - Kill all processing when not visible
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. ULTRA-FAST SEQUENTIAL LOADING
  useEffect(() => {
    let isMounted = true;

    const preloadFlavor = async (f: string) => {
      if (GLOBAL_IMAGE_CACHE[f] || LOADING_LOCKS[f]) return;
      LOADING_LOCKS[f] = true;

      const images: HTMLImageElement[] = [];
      const folderName = FLAVOR_MAP[f];
      
      // Load in larger chunks but with hardware decode to keep it off the main thread
      const chunkSize = f === flavor ? 20 : 5; 

      for (let i = 0; i < frameCount; i += chunkSize) {
        if (!isMounted) break;

        const promises = Array.from({ length: Math.min(chunkSize, frameCount - i) }).map((_, j) => {
          const index = i + j;
          return new Promise((resolve) => {
            const img = new Image();
            img.src = `/images/${folderName}/ezgif-frame-${(index + 1).toString().padStart(3, "0")}.jpg`;
            img.onload = () => {
              images[index] = img;
              if ("decode" in img) {
                (img as any).decode().then(() => resolve(img)).catch(() => resolve(img));
              } else {
                resolve(img);
              }
            };
            img.onerror = () => resolve(null);
          });
        });

        await Promise.all(promises);
        
        // Critical frames loaded? Start animation immediately
        if (f === flavor && i >= 30 && !isReady) {
          GLOBAL_IMAGE_CACHE[f] = images;
          setIsReady(true);
        }

        // Give the browser a moment to breathe
        await new Promise(r => requestAnimationFrame(r));
      }
      
      GLOBAL_IMAGE_CACHE[f] = images;
      delete LOADING_LOCKS[f];
    };

    const startLoading = async () => {
      // Priority 1: Current Flavor
      await preloadFlavor(flavor);
      
      // Priority 2: Other Flavors (Lazy)
      if (mode === "full") {
        for (const f of flavorsList) {
          if (f !== flavor && isMounted) {
            await new Promise(r => setTimeout(r, 2000));
            await preloadFlavor(f);
          }
        }
      }
    };

    startLoading();
    return () => { isMounted = false; };
  }, [flavor, frameCount, mode]);

  // 3. Canvas & Animation Logic - Optimized for 60fps
  useEffect(() => {
    if (!isReady || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { 
      alpha: false,
      desynchronized: true // Low latency rendering
    });
    if (!ctx) return;

    const render = () => {
      if (!isVisible || !canvas) return;
      
      const images = GLOBAL_IMAGE_CACHE[flavor];
      if (!images) return;

      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      
      // SKIP redundant renders to save CPU
      if (safeFrame === stateRef.current.lastRenderedFrame) return;
      
      const img = images[safeFrame];
      if (img && img.complete) {
        // PERF: Avoid complex scaling if possible
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        stateRef.current.lastRenderedFrame = safeFrame;
      }
    };

    const tl = gsap.timeline({ defaults: { force3D: true } });

    if (mode === "full") {
      tl.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
        onUpdate: render,
      });

      tl.to(stateRef.current, {
        frame: frameCount - 20,
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

    // Secondary idle wiggle
    gsap.to(stateRef.current, {
      idle: 1.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      // PERFORMANCE KILLER FIXED: Capping resolution at 1080p max
      // Drawing a 4K or 5K canvas was the reason for lag.
      const isMobile = window.innerWidth < 768;
      const maxRes = isMobile ? 1080 : 1920; 
      
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let width = window.innerWidth * dpr;
      let height = window.innerHeight * dpr;
      
      // Hard cap resolution to 1080p equivalent
      if (width > maxRes) {
        const ratio = maxRes / width;
        width = maxRes;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // High priority sync
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
        className="w-full h-full object-cover transition-opacity duration-1000"
        style={{ 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto",
          filter: mode === "wiggle" ? "contrast(1.02)" : "contrast(1.05) brightness(1.05)",
          willChange: "contents" 
        }}
      />
      
      {mode === "full" && (
        <>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)] opacity-80" />
          </div>
        </>
      )}
    </div>
  );
};
