"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Menu } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-8 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-black tracking-tighter text-white"
        >
          FANTA<span className="text-orange-500">.</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-12">
          {["MAHSULOTLAR", "TA'MLAR", "TARIX"].map((item, i) => (
            <motion.a 
              key={item} 
              href="#" 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-[10px] font-bold tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors uppercase"
            >
              {item}
            </motion.a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 glass rounded-full text-white hover:bg-orange-500/20 transition-all group"
          >
            <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:block px-6 py-2 rounded-full border border-white/10 text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all text-white"
          >
            HOZIR SINAB KO'RING
          </motion.button>

          <button className="p-3 glass rounded-full text-white md:hidden">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};
