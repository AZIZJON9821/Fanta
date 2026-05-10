"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SequencePlayerProps {
  folderPath: string;
  frameCount: number;
  onComplete?: () => void;
  mode: "cinematic" | "wiggle";
}

// ── Global cache: stores decoded ImageBitmap per folder ─────────────────────
const IMG_CACHE = new Map<string, HTMLImageElement[]>();
const LOAD_STATE = new Map<string, "loading" | "done">();
const LOAD_CALLBACKS = new Map<string, Array<() => void>>();

function loadFrames(
  folderPath: string,
  frameCount: number,
  onReady: () => void
): void {
  // Already cached — fire immediately
  if (LOAD_STATE.get(folderPath) === "done") {
    onReady();
    return;
  }

  // Register callback for when loading completes
  if (!LOAD_CALLBACKS.has(folderPath)) {
    LOAD_CALLBACKS.set(folderPath, []);
  }
  LOAD_CALLBACKS.get(folderPath)!.push(onReady);

  // Already loading — just registered callback, done
  if (LOAD_STATE.get(folderPath) === "loading") return;

  LOAD_STATE.set(folderPath, "loading");
  IMG_CACHE.set(folderPath, new Array(frameCount));

  const images = IMG_CACHE.get(folderPath)!;
  let loadedCount = 0;
  let readyFired = false;
  const READY_THRESHOLD = Math.min(40, frameCount); // Fire ready after 40 frames

  const checkReady = () => {
    loadedCount++;

    if (!readyFired && loadedCount >= READY_THRESHOLD) {
      readyFired = true;
      const cbs = LOAD_CALLBACKS.get(folderPath) ?? [];
      cbs.forEach(cb => cb());
    }

    if (loadedCount >= frameCount) {
      LOAD_STATE.set(folderPath, "done");
      // Fire again in case any cb was added after ready threshold
      const cbs = LOAD_CALLBACKS.get(folderPath) ?? [];
      if (!readyFired) cbs.forEach(cb => cb());
    }
  };

  // Load all frames — browser handles parallelism natively
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    const url = `${folderPath}/ezgif-frame-${(i + 1).toString().padStart(3, "0")}.jpg`;
    img.src = url;
    images[i] = img;

    if (img.complete) {
      checkReady();
    } else {
      img.onload = checkReady;
      img.onerror = checkReady; // Count even errors so we don't hang
    }
  }
}

export const SequencePlayer: React.FC<SequencePlayerProps> = ({
  folderPath,
  frameCount,
  onComplete,
  mode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(
    LOAD_STATE.get(folderPath) === "done"
  );

  const animRef = useRef({
    frame: mode === "wiggle" ? frameCount - 1 : 0,
    lastDrawn: -1,
    destroyed: false,
  });

  const layoutRef = useRef({
    scale: 1,
    ox: 0,
    oy: 0,
  });

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    animRef.current.destroyed = false;
    animRef.current.frame = mode === "wiggle" ? frameCount - 1 : 0;
    animRef.current.lastDrawn = -1;

    // If already done, set ready immediately
    if (LOAD_STATE.get(folderPath) === "done") {
      setReady(true);
      return;
    }

    setReady(false);
    loadFrames(folderPath, frameCount, () => {
      if (!animRef.current.destroyed) setReady(true);
    });

    return () => {
      animRef.current.destroyed = true;
    };
  }, [folderPath, frameCount, mode]);

  // ── Render ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const images = IMG_CACHE.get(folderPath);
    if (!images) return;

    animRef.current.frame = mode === "wiggle" ? frameCount - 1 : 0;
    animRef.current.lastDrawn = -1;

    const setupLayout = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const maxW = isMobile ? 1080 : 1920;

      let cw = window.innerWidth * dpr;
      let ch = (mode === "wiggle" ? canvas.parentElement?.clientHeight ?? window.innerHeight : window.innerHeight) * dpr;

      if (cw > maxW) { ch = ch * (maxW / cw); cw = maxW; }

      canvas.width = cw;
      canvas.height = ch;

      // Sample first valid image for aspect ratio
      const sample = images.find(img => img && img.naturalWidth > 0);
      if (sample) {
        const srcW = sample.naturalWidth || 1920;
        const srcH = sample.naturalHeight || 1080;
        const scale = Math.max(cw / srcW, ch / srcH);
        layoutRef.current = {
          scale,
          ox: Math.round((cw - srcW * scale) / 2),
          oy: Math.round((ch - srcH * scale) / 2),
        };
      }
    };

    const drawFrame = (rawIdx: number) => {
      const idx = Math.max(0, Math.min(frameCount - 1, Math.round(rawIdx)));
      if (idx === animRef.current.lastDrawn) return;

      let img = images[idx];

      // Fallback: find nearest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let d = 1; d < 25; d++) {
          const a = images[Math.max(0, idx - d)];
          if (a && a.complete && a.naturalWidth > 0) { img = a; break; }
          const b = images[Math.min(frameCount - 1, idx + d)];
          if (b && b.complete && b.naturalWidth > 0) { img = b; break; }
        }
      }

      if (img && img.complete && img.naturalWidth > 0) {
        const { scale, ox, oy } = layoutRef.current;
        ctx.drawImage(img, ox, oy, img.naturalWidth * scale, img.naturalHeight * scale);
        animRef.current.lastDrawn = idx;
      }
    };

    // RAF loop — brauzer refresh rate bilan sinxron
    let rafId = 0;
    const loop = () => {
      if (!animRef.current.destroyed) {
        drawFrame(animRef.current.frame);
        rafId = requestAnimationFrame(loop);
      }
    };

    // GSAP — faqat raqam boshqaradi, chizishni RAF qiladi
    const tl = gsap.timeline();

    if (mode === "cinematic") {
      tl.to(animRef.current, {
        frame: frameCount - 1,
        duration: 3,
        ease: "power2.out",
      });

      // Wiggle: 4 ta takror × 1.25s = ~5 soniya
      tl.to(animRef.current, {
        frame: frameCount - 20,
        duration: 1.25,
        repeat: 3,
        yoyo: true,
        ease: "sine.inOut",
        onComplete: () => {
          if (!animRef.current.destroyed) onComplete?.();
        }
      }, "-=0.05");
    } else {
      gsap.to(animRef.current, {
        frame: frameCount - 22,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    window.addEventListener("resize", setupLayout);
    setupLayout();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      tl.kill();
      gsap.killTweensOf(animRef.current);
      window.removeEventListener("resize", setupLayout);
    };
  }, [ready, folderPath, frameCount, mode, onComplete]);

  return (
    <div className="absolute inset-0 bg-black">
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
    </div>
  );
};
