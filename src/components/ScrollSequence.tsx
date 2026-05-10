"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

// SHARED CACHE - Senior Pro Architecture
const GLOBAL_IMAGE_CACHE = new Map<string, HTMLImageElement[]>();
const LOADING_STATUS = new Map<string, "loading" | "ready">();

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
    lastFrame: -1,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  // 1. Efficient Visibility Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.01 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. High-Performance Preloader (Task Queue)
  useEffect(() => {
    let active = true;

    const loadFlavor = async (f: string) => {
      if (GLOBAL_IMAGE_CACHE.has(f)) {
        if (f === flavor && active) setIsReady(true);
        return;
      }
      if (LOADING_STATUS.get(f) === "loading") return;
      
      LOADING_STATUS.set(f, "loading");
      const images: HTMLImageElement[] = [];
      const folder = FLAVOR_MAP[f];
      
      // Load in small batches to keep frame rate high
      const batchSize = f === flavor ? 12 : 4; 
      
      for (let i = 0; i < frameCount; i += batchSize) {
        if (!active) break;
        
        const batch = Array.from({ length: Math.min(batchSize, frameCount - i) }).map((_, j) => {
          const idx = i + j;
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
        
        // Initial Ready State
        if (f === flavor && i >= 40 && !isReady && active) {
          GLOBAL_IMAGE_CACHE.set(f, images);
          setIsReady(true);
        }
        
        // Let the main thread process UI events
        await new Promise(r => requestAnimationFrame(r));
      }

      GLOBAL_IMAGE_CACHE.set(f, images);
      LOADING_STATUS.set(f, "ready");
    };

    const init = async () => {
      await loadFlavor(flavor);
      // Wait for intro to settle before background loading
      if (mode === "full") {
        await new Promise(r => setTimeout(r, 4000));
        for (const f of flavorsList) {
          if (f !== flavor && active) {
            await loadFlavor(f);
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }
    };

    init();
    return () => { active = false; };
  }, [flavor, frameCount]);

  // 3. Optimized Rendering Pipeline
  useEffect(() => {
    if (!isReady || !canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = () => {
      if (!isVisible || !active) return;
      
      const images = GLOBAL_IMAGE_CACHE.get(flavor);
      if (!images) return;

      const rawFrame = stateRef.current.frame + stateRef.current.idle;
      const frameIdx = Math.round(Math.max(0, Math.min(frameCount - 1, rawFrame)));
      
      if (frameIdx === stateRef.current.lastFrame) return;

      const img = images[frameIdx];
      if (img && img.complete) {
        const { scale, offsetX, offsetY } = stateRef.current;
        ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
        stateRef.current.lastFrame = frameIdx;
      }
    };

    let active = true;
    const tl = gsap.timeline();

    if (mode === "full") {
      tl.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
        onUpdate: draw
      });

      tl.to(stateRef.current, {
        frame: frameCount - 20,
        duration: 1.2,
        repeat: 4,
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
      idle: 1.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: draw
    });

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      // HARD CAP: Senior Pro Performance - Max 1080p, Mobile 720p
      const limit = isMobile ? 1280 : 1920;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;

      if (w > limit) {
        h = h * (limit / w);
        w = limit;
      }

      canvas.width = w;
      canvas.height = h;

      // Pre-calculate layout to save CPU cycles in draw loop
      const imgWidth = 1920; // Assume 1080p source
      const imgHeight = 1080;
      const scale = Math.max(w / imgWidth, h / imgHeight);
      stateRef.current.scale = scale;
      stateRef.current.offsetX = (w - imgWidth * scale) / 2;
      stateRef.current.offsetY = (h - imgHeight * scale) / 2;
      
      draw();
    };

    window.addEventListener("resize", resize);
    resize();
    gsap.ticker.add(draw);

    return () => {
      active = false;
      tl.kill();
      gsap.ticker.remove(draw);
      gsap.killTweensOf(stateRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isReady, flavor, frameCount, onAutoNext, mode, isVisible]);

  return (
    <div ref={containerRef} className="sticky top-0 h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto",
          filter: mode === "wiggle" ? "contrast(1.02)" : "contrast(1.05) brightness(1.02)",
          willChange: "contents" 
        }}
      />
      {mode === "full" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      )}
    </div>
  );
};
