"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Menu } from "lucide-react";

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 md:px-12 md:py-8 flex items-center justify-between pointer-events-none"
    >
      <div className="flex items-center gap-8 pointer-events-auto">
        <div className="text-2xl font-black tracking-tighter text-white">
          FANTA<span className="text-orange-500">.</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
          <a href="#" className="hover:text-white transition-colors">Products</a>
          <a href="#" className="hover:text-white transition-colors">Flavors</a>
          <a href="#" className="hover:text-white transition-colors">Story</a>
        </div>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        <button className="p-3 glass rounded-full text-white hover:bg-orange-500/20 transition-all duration-500 group">
          <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="px-6 py-3 glass rounded-full text-[10px] font-bold tracking-widest text-white uppercase hover:bg-white/10 transition-all duration-500 hidden md:block">
          Experience Now
        </button>
        <button className="p-3 glass rounded-full text-white md:hidden">
          <Menu size={18} />
        </button>
      </div>
    </motion.nav>
  );
};
