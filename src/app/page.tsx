"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { ScrollSequence } from "@/components/ScrollSequence";
import { Navbar } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FLAVORS = [
  { name: "Apelsin", count: 121, color: "text-orange-500", glow: "shadow-orange-500/20", bg: "from-orange-500/10" },
  { name: "Marakuya", count: 121, color: "text-yellow-500", glow: "shadow-yellow-500/20", bg: "from-yellow-500/10" },
  { name: "Qulupnay", count: 121, color: "text-red-500", glow: "shadow-red-500/20", bg: "from-red-500/10" },
  { name: "Chernika & Malina", count: 121, color: "text-blue-500", glow: "shadow-blue-500/20", bg: "from-blue-500/10" },
  { name: "Siyohrang Chernika", count: 121, color: "text-purple-500", glow: "shadow-purple-500/20", bg: "from-purple-500/10" },
];

// Magnetic Wrapper Component
const Magnetic = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.4);
    y.set((clientY - centerY) * 0.4);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [showProgress, setShowProgress] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const nextFlavor = () => {
    setDirection(1);
    setShowProgress(false);
    setFlavorIndex((prev) => (prev + 1) % FLAVORS.length);
  };
  
  const prevFlavor = () => {
    setDirection(-1);
    setShowProgress(false);
    setFlavorIndex((prev) => (prev - 1 + FLAVORS.length) % FLAVORS.length);
  };

  const currentFlavor = FLAVORS[flavorIndex];

  // Logic to show progress bar after intro animation (approx 3s)
  useEffect(() => {
    const timer = setTimeout(() => setShowProgress(true), 3000);
    return () => clearTimeout(timer);
  }, [flavorIndex]);

  const variants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      rotateY: direction > 0 ? 45 : -45,
      rotateZ: direction > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: "anticipate" }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      rotateY: direction > 0 ? -45 : 45,
      rotateZ: direction > 0 ? -20 : 20,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 1.2, ease: "anticipate" }
    })
  };

  return (
    <main className="relative bg-black overflow-hidden selection:bg-orange-500 selection:text-white">
      <SmoothScroll />
      <Navbar />

      {/* Ultra-Thin Global Progress Bar (Top) */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[110] pointer-events-none overflow-hidden">
         <motion.div 
           key={currentFlavor.name + showProgress}
           initial={{ x: "-100%" }}
           animate={showProgress ? { x: "0%" } : { x: "-100%" }}
           transition={{ duration: 5, ease: "linear" }}
           className={`w-full h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80`}
         />
      </div>

      <section ref={heroRef} className="relative h-screen overflow-hidden perspective-2000">
        {/* Dynamic Background Glow */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentFlavor.name + "_bg"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className={`absolute inset-0 bg-gradient-to-b ${currentFlavor.bg} to-transparent opacity-30 z-0`}
          />
        </AnimatePresence>

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentFlavor.name}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 z-10"
            style={{ transformStyle: "preserve-3d" }}
          >
            <ScrollSequence 
              flavor={currentFlavor.name} 
              frameCount={currentFlavor.count} 
              onAutoNext={nextFlavor}
              mode="full"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Buttons with Magnetic Effect */}
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12 z-50 pointer-events-none">
          <Magnetic>
            <button 
              onClick={prevFlavor}
              className="p-4 md:p-6 glass rounded-full text-white pointer-events-auto hover:bg-white/10 transition-colors group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ChevronLeft size={32} className="group-hover:text-orange-500 transition-colors relative z-10" />
            </button>
          </Magnetic>

          <Magnetic>
            <button 
              onClick={nextFlavor}
              className="p-4 md:p-6 glass rounded-full text-white pointer-events-auto hover:bg-white/10 transition-colors group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ChevronRight size={32} className="group-hover:text-orange-500 transition-colors relative z-10" />
            </button>
          </Magnetic>
        </div>

        <div className="absolute bottom-12 left-12 z-40">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFlavor.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-[10px] font-black tracking-[0.5em] text-white/30 uppercase block mb-2">Tanlangan Ta'm</span>
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase ${currentFlavor.color}`}>
                {currentFlavor.name}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="relative min-h-screen bg-black px-6 md:px-24 py-32 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase">
              ODATIY MAS, <br /> <span className="text-orange-500">MUKAMMAL.</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-md mb-12">
              Futuristik suyuqlik texnologiyasi va tabiiy meva lazzati uyg'unligini his eting. 
              Har bir qultum - bu ta'mlar olamiga qilingan kinematografik sayohatdir.
            </p>
            <div className="flex flex-wrap gap-12">
              <div>
                <div className="text-4xl font-black text-white">100%</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-2">Tabiiy Ta'm</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">∞</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-2">Energiya Quvvati</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="aspect-square glass rounded-3xl relative overflow-hidden group border border-white/5"
          >
             <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFlavor.name}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full"
                  >
                    <ScrollSequence 
                      flavor={currentFlavor.name} 
                      frameCount={currentFlavor.count} 
                      mode="wiggle"
                    />
                  </motion.div>
                </AnimatePresence>
             </div>
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </section>

      <footer className="bg-black py-24 px-6 md:px-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
           <div className="text-4xl font-black tracking-tighter">
             FANTA<span className="text-orange-500">.</span>
           </div>
           <div className="flex gap-12 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
             <a href="#" className="hover:text-white transition-colors">Maxfiylik</a>
             <a href="#" className="hover:text-white transition-colors">Shartlar</a>
             <a href="#" className="hover:text-white transition-colors">Aloqa</a>
           </div>
           <div className="text-[10px] font-medium text-white/20">
             © 2026 FANTA FUTURE LTD. BARCHA HUQUQLAR HIMOYA LANGAN.
           </div>
        </div>
      </footer>
    </main>
  );
}
