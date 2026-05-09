"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollSequence } from "@/components/ScrollSequence";
import { Navbar } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FLAVORS = [
  { name: "Apelsin", count: 121, color: "text-orange-500", glow: "shadow-orange-500/20" },
  { name: "Marakuya", count: 121, color: "text-yellow-500", glow: "shadow-yellow-500/20" },
  { name: "Qulupnay", count: 121, color: "text-red-500", glow: "shadow-red-500/20" },
  { name: "Chernika&Malina", count: 121, color: "text-blue-500", glow: "shadow-blue-500/20" },
  { name: "SiyohrangCHernika", count: 121, color: "text-purple-500", glow: "shadow-purple-500/20" },
];

export default function Home() {
  const [flavorIndex, setFlavorIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const nextFlavor = () => setFlavorIndex((prev) => (prev + 1) % FLAVORS.length);
  const prevFlavor = () => setFlavorIndex((prev) => (prev - 1 + FLAVORS.length) % FLAVORS.length);

  const currentFlavor = FLAVORS[flavorIndex];

  return (
    <main className="relative bg-black">
      <SmoothScroll />
      <Navbar />

      {/* Hero Section with Auto-play Sequence */}
      <section ref={heroRef} className="relative h-screen">
        <ScrollSequence 
          key={currentFlavor.name} 
          flavor={currentFlavor.name} 
          frameCount={currentFlavor.count} 
        />
        
        {/* Navigation Buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12 z-40 pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevFlavor}
            className="p-4 md:p-6 glass rounded-full text-white pointer-events-auto hover:bg-white/10 transition-colors group"
          >
            <ChevronLeft size={32} className="group-hover:text-orange-500 transition-colors" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextFlavor}
            className="p-4 md:p-6 glass rounded-full text-white pointer-events-auto hover:bg-white/10 transition-colors group"
          >
            <ChevronRight size={32} className="group-hover:text-orange-500 transition-colors" />
          </motion.button>
        </div>

        {/* Flavor Name Overlay (Bottom Left) */}
        <div className="absolute bottom-12 left-12 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFlavor.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-[10px] font-black tracking-[0.5em] text-white/30 uppercase block mb-2">Selected Taste</span>
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase ${currentFlavor.color}`}>
                {currentFlavor.name.replace("&", " & ")}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Product Details Section */}
      <section className="relative min-h-screen bg-black px-6 md:px-24 py-32 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
              BEYOND THE <br /> <span className="text-orange-500">ORDINARY.</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-md mb-12">
              Experience the fusion of futuristic liquid technology and natural essence. 
              Each sip is a journey through a cinematic landscape of flavor.
            </p>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-black text-white">100%</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-1">Natural Flavor</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">0</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-1">Artificial Colors</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">∞</div>
                <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase mt-1">Energy Boost</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="aspect-square glass rounded-3xl relative overflow-hidden group"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
             <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="w-full h-full border border-white/10 rounded-2xl flex items-center justify-center text-white/10 font-black text-9xl uppercase">
                  {currentFlavor.name.substring(0, 4)}
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-24 px-6 md:px-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
           <div className="text-4xl font-black tracking-tighter">
             FANTA<span className="text-orange-500">.</span>
           </div>
           <div className="flex gap-12 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
             <a href="#" className="hover:text-white transition-colors">Privacy</a>
             <a href="#" className="hover:text-white transition-colors">Terms</a>
             <a href="#" className="hover:text-white transition-colors">Contact</a>
           </div>
           <div className="text-[10px] font-medium text-white/20">
             © 2026 FANTA FUTURE LTD. ALL RIGHTS RESERVED.
           </div>
        </div>
      </footer>
    </main>
  );
}
