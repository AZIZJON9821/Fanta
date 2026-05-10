"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle";
}

const flavorCache: Record<string, HTMLImageElement[]> = {};

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
  const [isReady, setIsReady] = useState(false);
  const [dustParticles, setDustParticles] = useState<any[]>([]);
  
  const stateRef = useRef({ 
    frame: mode === "wiggle" ? frameCount - 1 : 0,
    idle: 0 
  });

  // 1. Initialize particles after mount
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? (mode === "wiggle" ? 3 : 8) : (mode === "wiggle" ? 5 : 15);
    const particles = [...Array(count)].map((_, i) => ({
      id: i,
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.5,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
      moveX: Math.random() * 100 - 50,
    }));
    setDustParticles(particles);
  }, [mode]);

  // 2. ULTRA-OPTIMIZED SEQUENTIAL PRELOADER
  useEffect(() => {
    let isMounted = true;

    const preloadFlavor = async (f: string, highPriority: boolean = false) => {
      if (flavorCache[f]) return;

      const images: HTMLImageElement[] = [];
      const folderName = FLAVOR_MAP[f];
      
      // Load in chunks to avoid blocking the CPU
      const chunkSize = highPriority ? 20 : 10;
      const totalFrames = frameCount;

      for (let i = 0; i < totalFrames; i += chunkSize) {
        if (!isMounted) return;

        const chunkPromises = Array.from({ length: Math.min(chunkSize, totalFrames - i) }).map((_, j) => {
          const index = i + j;
          return new Promise((resolve) => {
            const img = new Image();
            const frameNumber = (index + 1).toString().padStart(3, "0");
            img.src = `/images/${folderName}/ezgif-frame-${frameNumber}.jpg`;
            img.onload = () => {
              images[index] = img;
              // Decode high priority images immediately to avoid stutter during first frame
              if (highPriority && "decode" in img) {
                (img as any).decode().then(resolve).catch(resolve);
              } else {
                resolve(img);
              }
            };
            img.onerror = resolve;
          });
        });

        await Promise.all(chunkPromises);
        
        // After first 30 frames of CURRENT flavor, set ready
        if (f === flavor && i >= 20 && !isReady) {
          flavorCache[f] = images;
          setIsReady(true);
        }

        // Small break to allow main thread to breathe
        await new Promise(r => setTimeout(r, 10));
      }
      
      flavorCache[f] = images;
    };

    const startPreloading = async () => {
      // Step 1: High Priority - Load Current Flavor
      await preloadFlavor(flavor, true);
      
      // Step 2: Low Priority - Load Other Flavors one by one
      for (const f of flavorsList) {
        if (f !== flavor) {
          await new Promise(r => setTimeout(r, 1000)); // Wait before next flavor
          await preloadFlavor(f, false);
        }
      }
    };

    startPreloading();
    return () => { isMounted = false; };
  }, [frameCount, flavor]);

  // 3. Handle Switch Transition
  useEffect(() => {
    if (flavorCache[flavor]) {
      gsap.to(canvasRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          gsap.killTweensOf(stateRef.current);
          stateRef.current.frame = mode === "wiggle" ? frameCount - 1 : 0;
          setIsReady(true);
          gsap.to(canvasRef.current, { opacity: 1, duration: 0.5 });
        }
      });
    } else {
      setIsReady(false);
    }
  }, [flavor, mode, frameCount]);

  // 4. Animation Logic
  useEffect(() => {
    if (!isReady || !canvasRef.current || !flavorCache[flavor]) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const render = () => {
      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      const images = flavorCache[flavor];
      const img = images ? images[safeFrame] : null;

      if (img && canvas) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = window.innerWidth < 768 ? "medium" : "high";
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    };

    const mainTimeline = gsap.timeline();

    if (mode === "full") {
      mainTimeline.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
        onUpdate: render,
      });

      mainTimeline.to(stateRef.current, {
        frame: frameCount - 18,
        duration: 1.0,
        repeat: 5,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: render,
        onComplete: () => {
          if (onAutoNext) onAutoNext();
        }
      }, "-=0.2");
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

    const idleAnimation = gsap.to(stateRef.current, {
      idle: 1.2,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    render();

    return () => {
      mainTimeline.kill();
      gsap.killTweensOf(stateRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady, flavor, frameCount, onAutoNext, mode]);

  return (
    <div className="sticky top-0 h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover", 
          opacity: isReady ? 1 : 0,
          imageRendering: "auto",
          filter: mode === "wiggle" ? "contrast(1.05) saturate(1.1)" : "contrast(1.08) brightness(1.05) saturate(1.15) drop-shadow(0 0 0 black)", 
        }}
        className="will-change-transform transition-opacity duration-500"
      />
      
      {mode === "full" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      )}
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)] opacity-80" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-30">
        {dustParticles.map((p) => (
          <div 
            key={p.id}
            className="absolute bg-white rounded-full blur-[1px] animate-dust"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // @ts-ignore
              "--move-x": `${p.moveX}px`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes dust {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translate(var(--move-x), -100px); opacity: 0; }
        }
        .animate-dust {
          animation: dust linear infinite;
        }
      `}</style>
    </div>
  );
};
