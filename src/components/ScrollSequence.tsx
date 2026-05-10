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
const LOADING_STATUS = new Map<string, boolean>();

const FLAVOR_MAP: Record<string, string> = {
  "Apelsin": "Apelsin",
  "Marakuya": "Marakuya",
  "Qulupnay": "Qulupnay",
  "Chernika & Malina": "Chernika&Malina",
  "Siyohrang Chernika": "SiyohrangCHernika"
};

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({
  flavor,
  frameCount,
  onAutoNext,
  mode = "full",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isReady, setIsReady] = useState(false);
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
      if (LOADING_STATUS.get(f)) {
        const check = setInterval(() => {
          if (GLOBAL_CACHE.has(f)) {
            if (f === flavor && active) setIsReady(true);
            clearInterval(check);
          }
        }, 100);
        return;
      }
      
      LOADING_STATUS.set(f, true);
      const images: HTMLImageElement[] = [];
      const folder = FLAVOR_MAP[f];
      
      const loadFrames = async (start: number, end: number) => {
        const promises = Array.from({ length: end - start }).map((_, j) => {
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
        await Promise.all(promises);
      };

      if (f === flavor) {
        await loadFrames(0, 40);
        if (active) {
          GLOBAL_CACHE.set(f, images);
          setIsReady(true);
        }
      }

      for (let i = (f === flavor ? 40 : 0); i < frameCount; i += 15) {
        if (!active || stateRef.current.isDestroyed) break;
        await loadFrames(i, Math.min(i + 15, frameCount));
        await new Promise(r => requestAnimationFrame(r));
      }

      GLOBAL_CACHE.set(f, images);
      LOADING_STATUS.set(f, false);
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
      if (!images) return;

      const raw = stateRef.current.frame + stateRef.current.idle;
      const idx = Math.round(Math.max(0, Math.min(frameCount - 1, raw)));
      if (idx === stateRef.current.lastFrame) return;

      const img = images[idx];
      if (img && img.complete) {
        const { scale, offsetX, offsetY } = stateRef.current;
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
        frame: frameCount - 20,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: draw
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
      const limit = isMobile ? 1024 : 1600; 
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      
      let w = window.innerWidth * dpr;
      let h = window.innerHeight * dpr;

      if (w > limit) {
        h = h * (limit / w);
        w = limit;
      }

      canvas.width = w;
      canvas.height = h;

      const scale = Math.max(w / 1920, h / 1080);
      stateRef.current.scale = scale;
      stateRef.current.offsetX = (w - 1920 * scale) / 2;
      stateRef.current.offsetY = (h - 1080 * scale) / 2;
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
  }, [isReady, flavor, frameCount, mode, isVisible]);

  if (!mounted) return <div className="h-full w-full bg-black" />;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black">
      <div 
        className={`absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">Yuklanmoqda...</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto"
        }}
      />
    </div>
  );
};
