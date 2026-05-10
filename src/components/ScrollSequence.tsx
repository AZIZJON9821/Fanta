"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

// Global cache with limited size to prevent memory pressure stutters
const flavorCache: Record<string, HTMLImageElement[]> = {};
const loadingQueue: string[] = [];

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
    idle: 0 
  });

  // 1. Intersection Observer to stop rendering when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Optimized Sequential Loading with memory safety
  useEffect(() => {
    let isMounted = true;

    const preloadFlavor = async (f: string, highPriority: boolean = false) => {
      if (flavorCache[f]) return;
      if (loadingQueue.includes(f) && !highPriority) return;
      loadingQueue.push(f);

      const images: HTMLImageElement[] = [];
      const folderName = FLAVOR_MAP[f];
      const chunkSize = highPriority ? 15 : 5; // Smaller chunks to keep main thread free

      for (let i = 0; i < frameCount; i += chunkSize) {
        if (!isMounted) break;

        const promises = Array.from({ length: Math.min(chunkSize, frameCount - i) }).map((_, j) => {
          const index = i + j;
          return new Promise((resolve) => {
            const img = new Image();
            img.src = `/images/${folderName}/ezgif-frame-${(index + 1).toString().padStart(3, "0")}.jpg`;
            img.onload = () => {
              images[index] = img;
              if (highPriority && "decode" in img) {
                (img as any).decode().then(resolve).catch(resolve);
              } else {
                resolve(img);
              }
            };
            img.onerror = resolve;
          });
        });

        await Promise.all(promises);
        
        // Quick release to keep UI responsive
        if (i % 30 === 0) await new Promise(r => requestAnimationFrame(r));
        
        if (f === flavor && i >= 20 && !isReady) {
          flavorCache[f] = images;
          setIsReady(true);
        }
      }
      
      flavorCache[f] = images;
      const qIdx = loadingQueue.indexOf(f);
      if (qIdx > -1) loadingQueue.splice(qIdx, 1);

      // Memory Cleanup: Keep only 3 flavors in cache to prevent RAM stutters
      const cachedFlavors = Object.keys(flavorCache);
      if (cachedFlavors.length > 3) {
        const toDelete = cachedFlavors.find(cf => cf !== flavor && !loadingQueue.includes(cf));
        if (toDelete) delete flavorCache[toDelete];
      }
    };

    const startLoading = async () => {
      await preloadFlavor(flavor, true);
      // Wait for intro to finish before loading background flavors
      await new Promise(r => setTimeout(r, 4000));
      for (const f of flavorsList) {
        if (f !== flavor && isMounted) {
          await preloadFlavor(f, false);
          await new Promise(r => setTimeout(r, 2000)); // Large gap to prevent CPU spikes
        }
      }
    };

    startLoading();
    return () => { isMounted = false; };
  }, [flavor, frameCount]);

  // 3. Animation and Canvas Logic
  useEffect(() => {
    if (!isReady || !canvasRef.current || !flavorCache[flavor] || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const render = () => {
      if (!isVisible) return;
      const images = flavorCache[flavor];
      if (!images) return;

      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      const img = images[safeFrame];

      if (img) {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
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
        frame: frameCount - 20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: render,
      });
    }

    gsap.to(stateRef.current, {
      idle: 1.2,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // PERFORMANCE: Reduced DPR for wiggle mode and mobile to ensure 60fps
      const maxDpr = mode === "wiggle" ? 1 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Use GSAP Ticker for smoother rendering sync
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
        className="w-full h-full object-cover transition-opacity duration-700"
        style={{ 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto",
          filter: mode === "wiggle" ? "contrast(1.02)" : "contrast(1.05) brightness(1.02)",
          willChange: "transform"
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
