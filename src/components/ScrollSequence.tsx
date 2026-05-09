"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
  onAutoNext?: () => void;
  mode?: "full" | "wiggle"; // New prop to control behavior
}

const flavorCache: Record<string, HTMLImageElement[]> = {};
const flavorsList = ["Apelsin", "Marakuya", "Qulupnay", "Chernika & Malina", "Siyohrang Chernika"];

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

  useEffect(() => {
    const particles = [...Array(mode === "wiggle" ? 5 : 15)].map((_, i) => ({
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

  useEffect(() => {
    const preloadAll = async () => {
      for (const f of flavorsList) {
        if (flavorCache[f]) continue;
        
        const images: HTMLImageElement[] = [];
        const loadPromises = Array.from({ length: frameCount }).map((_, i) => {
          return new Promise((resolve) => {
            const img = new Image();
            const frameNumber = (i + 1).toString().padStart(3, "0");
            const flavorPath = f.replace(/ /g, ""); // Remove spaces for paths
            img.src = `/images/${f.replace(" & ", "&").replace(" ", "")}/ezgif-frame-${frameNumber}.jpg`;
            img.onload = () => {
              images[i] = img;
              resolve(img);
            };
            img.onerror = resolve;
          });
        });

        if (f === flavor) {
          await Promise.all(loadPromises.slice(0, 20));
          flavorCache[f] = images;
          setIsReady(true);
        }
        
        Promise.all(loadPromises).then(() => {
          flavorCache[f] = images;
        });
      }
    };

    preloadAll();
  }, [frameCount, flavor]);

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

  useEffect(() => {
    if (!isReady || !canvasRef.current || !flavorCache[flavor]) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { 
      alpha: false,
      desynchronized: true 
    });
    if (!ctx) return;

    const render = () => {
      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      const images = flavorCache[flavor];
      const img = images ? images[safeFrame] : null;

      if (img && canvas) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    };

    if (mode === "full") {
      const introAnimation = gsap.to(stateRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.inOut",
        onUpdate: render,
        onComplete: () => {
          gsap.to(stateRef.current, {
            frame: frameCount - 15,
            duration: 1.2,
            repeat: 4, 
            yoyo: true,
            ease: "sine.inOut",
            onUpdate: render,
            onComplete: () => {
              if (onAutoNext) onAutoNext();
            }
          });
        }
      });
    } else {
      // mode === "wiggle" - Infinite wiggle on last frames
      gsap.to(stateRef.current, {
        frame: frameCount - 20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: render,
      });
    }

    const idleAnimation = gsap.to(stateRef.current, {
      idle: 0.8,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      const dpr = (window.devicePixelRatio || 1) * 1.25;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    render();

    return () => {
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
