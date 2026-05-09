"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScrollSequence } from "@/components/ScrollSequence";
import { Navbar } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ArrowDown } from "lucide-react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1.5]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <main ref={containerRef} className="relative bg-black">
      <SmoothScroll />
      <Navbar />

      {/* Hero Section with Auto-play Sequence */}
      <section ref={heroRef} className="relative h-screen">
        <ScrollSequence flavor="Apelsin" frameCount={121} containerRef={heroRef} />
        
        {/* Floating Content Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-6"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 3, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <span className="block text-[10px] md:text-xs font-bold tracking-[0.5em] text-orange-500 uppercase mb-4">
              The Future of Taste
            </span>
            <span className="block text-6xl md:text-9xl font-black tracking-tighter leading-none">
              PURE<br />ENERGY
            </span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-12 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase">Scroll to explore</span>
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ArrowDown size={16} className="text-orange-500" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Side Info */}
        <motion.div 
          style={{ opacity }}
          className="fixed left-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-12 z-20 pointer-events-none"
        >
          {[
            { label: "01", title: "CRAFTED" },
            { label: "02", title: "INFUSED" },
            { label: "03", title: "BORN" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-orange-500">{item.label}</span>
              <span className="text-xs font-bold tracking-widest text-white/20 uppercase">{item.title}</span>
            </div>
          ))}
        </motion.div>
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
              Experience the fusion of futuristic liquid technology and natural orange essence. 
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
                <div className="w-full h-full border border-white/10 rounded-2xl flex items-center justify-center text-white/10 font-black text-9xl">
                  ORNG
                </div>
             </div>
             <div className="absolute inset-x-0 bottom-0 p-12 translate-y-full group-hover:translate-y-0 transition-transform duration-700 bg-gradient-to-t from-black to-transparent">
                <p className="text-sm font-medium text-white/80">Captured at 240fps using Phantom Flex4K.</p>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Flavors Grid */}
      <section className="relative bg-[#050505] py-32 px-6 md:px-24">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">Choose Your Vibe</h2>
          <p className="text-white/40 text-sm font-medium">EXPLORE THE FULL COLLECTION</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Apelsin", color: "from-orange-600 to-orange-900" },
            { name: "Marakuya", color: "from-yellow-500 to-yellow-800" },
            { name: "Qulupnay", color: "from-red-600 to-red-900" },
            { name: "Chernika", color: "from-blue-600 to-blue-900" },
          ].map((flavor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl glass cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${flavor.color} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <span className="text-2xl font-black tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-700">{flavor.name}</span>
                <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">Discover</span>
              </div>
            </motion.div>
          ))}
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
