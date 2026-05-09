"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ScrollSequenceProps {
  flavor: string;
  frameCount: number;
}

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({
  flavor,
  frameCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stateRef = useRef({ 
    frame: 0,
    idle: 0 
  });

  // Preload images - Triggers on flavor change
  useEffect(() => {
    setIsReady(false);
    imagesRef.current = [];
    stateRef.current.frame = 0;

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    const loadImages = () => {
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        const frameNumber = (i + 1).toString().padStart(3, "0");
        img.src = `/images/${flavor}/ezgif-frame-${frameNumber}.jpg`;
        
        img.onload = () => {
          loadedCount++;
          images[i] = img;
          if (loadedCount === frameCount) {
            imagesRef.current = images;
            setIsReady(true);
          }
        };
      }
    };

    loadImages();
  }, [flavor, frameCount]);

  // Animation Logic
  useEffect(() => {
    if (!isReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const render = () => {
      const currentFrame = Math.round(stateRef.current.frame + stateRef.current.idle);
      const safeFrame = Math.max(0, Math.min(frameCount - 1, currentFrame));
      const img = imagesRef.current[safeFrame];

      if (img) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    };

    // 1. AUTO-PLAY INTRO ANIMATION
    const introAnimation = gsap.to(stateRef.current, {
      frame: frameCount - 1,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: render,
    });

    // 2. Idle "Breathing" Animation
    const idleAnimation = gsap.to(stateRef.current, {
      idle: 0.8,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: render,
    });

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      render();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    render();

    return () => {
      introAnimation.kill();
      idleAnimation.kill();
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady, flavor, frameCount]);

  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        className="will-change-transform"
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)] opacity-80" />
        
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-orange-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-orange-400/5 rounded-full blur-[80px]" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full blur-[1px] animate-dust"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5,
              animationDuration: `${Math.random() * 20 + 20}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes dust {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translate(${Math.random() * 100 - 50}px, -100px); opacity: 0; }
        }
        .animate-dust {
          animation: dust linear infinite;
        }
      `}</style>
    </div>
  );
};
