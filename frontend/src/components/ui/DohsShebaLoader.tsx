'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface DohsShebaLoaderProps {
  variant?: 'fullScreen' | 'section' | 'inline' | 'overlay';
  text?: string;
  subtext?: string;
}

const ROTATING_MESSAGES = [
  'Loading DOHS Sheba...',
  'Preparing Fresh Groceries...',
  'Finding Nearby Shops & Vendors...',
  'Organizing 45-Min Express Delivery...',
  'Almost Ready...'
];

export function DohsShebaLoader({
  variant = 'fullScreen',
  text,
  subtext,
}: DohsShebaLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const activeMessage = text || ROTATING_MESSAGES[messageIndex];

  const content = (
    <div className="flex flex-col items-center justify-center space-y-6 text-center select-none p-6">
      {/* Animated Brand Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Soft Outer Pulsing Glow */}
        <motion.div
          className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#0E7A45]/30 via-[#28A745]/20 to-[#F59E0B]/30 blur-xl"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.5, 0.9, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary Accent Ring */}
        <motion.div
          className="absolute -inset-2 rounded-2xl border-2 border-[#28A745]/40"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main Logo Badge */}
        <motion.div
          className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0E7A45] to-[#28A745] text-white font-black text-3xl shadow-2xl flex items-center justify-center border border-white/20"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span className="tracking-tighter">dS</span>

          {/* Floating Sparkle Badge */}
          <motion.div
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#F59E0B] text-white shadow-md"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 20, -20, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>
      </div>

      {/* Brand Title & Animated Text */}
      <div className="space-y-2 max-w-xs">
        <div className="flex items-center justify-center gap-1.5 font-black text-xl text-[#0E7A45] tracking-tight">
          <span>DOHS Sheba</span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
        </div>

        {/* Rotating Message Banner */}
        <div className="h-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeMessage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-semibold text-slate-500 tracking-wide"
            >
              {activeMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {subtext && (
          <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>
        )}
      </div>

      {/* Modern Bouncing Dots Progress */}
      <div className="flex items-center gap-1.5 pt-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#0E7A45]"
            animate={{
              y: ['0%', '-60%', '0%'],
              backgroundColor: ['#0E7A45', '#F59E0B', '#0E7A45'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E7A45]">
        <motion.div
          className="w-4 h-4 rounded-md bg-[#0E7A45] text-white text-[9px] font-black flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          dS
        </motion.div>
        <span>{text || 'Loading...'}</span>
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className="w-full py-12 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100">
        {content}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  // Default: fullScreen / page loader
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white via-emerald-50/20 to-white">
      {content}
    </div>
  );
}
