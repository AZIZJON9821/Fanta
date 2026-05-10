"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { SequencePlayer } from "@/components/SequencePlayer";
import { Navbar } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Flavor Config ─────────────────────────────────────────────────────────────
const FLAVORS = [
  {
    name: "Apelsin",
    folder: "/images/Apelsin",
    frameCount: 121,
    color: "text-orange-400",
    accent: "#f97316",
    bg: "from-orange-500/15",
  },
  {
    name: "Marakuya",
    folder: "/images/Marakuya",
    frameCount: 121,
    color: "text-yellow-400",
    accent: "#eab308",
    bg: "from-yellow-500/15",
  },
  {
    name: "Qulupnay",
    folder: "/images/Qulupnay",
    frameCount: 121,
    color: "text-red-400",
    accent: "#ef4444",
    bg: "from-red-500/15",
  },
  {
    name: "Chernika & Malina",
    folder: "/images/Chernika&Malina",
    frameCount: 121,
    color: "text-blue-400",
    accent: "#3b82f6",
    bg: "from-blue-500/15",
  },
  {
    name: "Siyohrang Chernika",
    folder: "/images/SiyohrangCHernika",
    frameCount: 121,
    color: "text-purple-400",
    accent: "#a855f7",
    bg: "from-purple-500/15",
  },
];

// ─── Magnetic Button ──────────────────────────────────────────────────────────
const Magnetic = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.35);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const goNext = () => {
    setDir(1);
    setIdx(p => (p + 1) % FLAVORS.length);
  };

  const goPrev = () => {
    setDir(-1);
    setIdx(p => (p - 1 + FLAVORS.length) % FLAVORS.length);
  };

  const current = FLAVORS[idx];

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <main className="relative bg-black overflow-x-hidden">
      <SmoothScroll />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden">

        {/* Dynamic background glow per flavor */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name + "_glow"}
            className={`absolute inset-0 bg-gradient-to-b ${current.bg} to-transparent z-0`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>

        {/* ── 3D Flavor Transition ────────────────────────────────────────── */}
        <div
          className="absolute inset-0 z-10"
          style={{ perspective: "2000px" }}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={current.name}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
              custom={dir}
              initial={(d) => ({
                x: d > 0 ? "100%" : "-100%",
                rotateY: d > 0 ? 40 : -40,
                opacity: 0,
                scale: 0.85,
              })}
              animate={{
                x: 0,
                rotateY: 0,
                opacity: 1,
                scale: 1,
                transition: { duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] },
              }}
              exit={(d) => ({
                x: d > 0 ? "-100%" : "100%",
                rotateY: d > 0 ? -40 : 40,
                opacity: 0,
                scale: 0.85,
                transition: { duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] },
              })}
            >
              <SequencePlayer
                key={current.folder}
                folderPath={current.folder}
                frameCount={current.frameCount}
                mode="cinematic"
                onComplete={goNext}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Vignette overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
        </div>

        {/* ── Nav Buttons ──────────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-30 flex items-center justify-between px-6 md:px-12 pointer-events-none">
          <Magnetic>
            <button
              onClick={goPrev}
              className="pointer-events-auto p-4 md:p-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300 group"
            >
              <ChevronLeft size={28} className="group-hover:text-orange-400 transition-colors" />
            </button>
          </Magnetic>

          <Magnetic>
            <button
              onClick={goNext}
              className="pointer-events-auto p-4 md:p-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300 group"
            >
              <ChevronRight size={28} className="group-hover:text-orange-400 transition-colors" />
            </button>
          </Magnetic>
        </div>

        {/* ── Flavor Name ──────────────────────────────────────────────────── */}
        <div className="absolute bottom-10 left-10 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase mb-1">
                Tanlangan Ta'm
              </p>
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase ${current.color}`}>
                {current.name}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Flavor Dots ──────────────────────────────────────────────────── */}
        <div className="absolute bottom-10 right-10 z-30 flex gap-2">
          {FLAVORS.map((f, i) => (
            <button
              key={f.name}
              onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-orange-500" : "bg-white/20 hover:bg-white/50"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Product Section ─────────────────────────────────────────────────── */}
      <section className="relative bg-black px-6 md:px-24 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="text-[10px] font-bold tracking-[0.5em] text-orange-500/60 uppercase mb-6">
              Fanta Future
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8 leading-none">
              ODATIY MAS,{" "}
              <span className="text-orange-500">MUKAMMAL.</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md mb-12">
              Futuristik suyuqlik texnologiyasi va tabiiy meva lazzati uyg'unligini his eting.
              Har bir qultum — bu ta'mlar olamiga qilingan kinematografik sayohatdir.
            </p>
            <div className="flex gap-16">
              <div>
                <div className="text-4xl font-black text-white">100%</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-2">
                  Tabiiy Ta'm
                </div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">∞</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-2">
                  Energiya
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Live wiggle preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="aspect-square rounded-3xl relative overflow-hidden border border-white/5"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.name + "_preview"}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <SequencePlayer
                  key={current.folder + "_wiggle"}
                  folderPath={current.folder}
                  frameCount={current.frameCount}
                  mode="wiggle"
                />
              </motion.div>
            </AnimatePresence>

            {/* Glass accent overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 30% 70%, ${current.accent}15, transparent 70%)`,
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/5 py-20 px-6 md:px-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
          <div className="text-3xl font-black tracking-tighter">
            FANTA<span className="text-orange-500">.</span>
          </div>
          <div className="flex gap-10 text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase">
            <a href="#" className="hover:text-white transition-colors">Maxfiylik</a>
            <a href="#" className="hover:text-white transition-colors">Shartlar</a>
            <a href="#" className="hover:text-white transition-colors">Aloqa</a>
          </div>
          <div className="text-[10px] text-white/15">
            © 2026 FANTA FUTURE LTD. BARCHA HUQUQLAR HIMOYA LANGAN.
          </div>
        </div>
      </footer>
    </main>
  );
}
