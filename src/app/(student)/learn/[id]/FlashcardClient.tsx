"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Word {
  id: string;
  word: string;
  type: string;
  definition: string;
  example: string;
  phonetic?: string | null;
}

export default function FlashcardClient({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const current = words[index];

  const next = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % words.length);
  };

  const prev = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* Progress Indicators */}
      <div className="flex gap-2">
        {words.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 w-8 rounded-full transition-all duration-500",
              i === index ? "bg-primary w-12 shadow-[0_0_12px_rgba(var(--primary),0.5)]" : "bg-muted/50"
            )}
          />
        ))}
      </div>

      {/* Flashcard Container */}
      <div className="relative w-full max-w-2xl aspect-[1.6/1] perspective-1000 group">
        <motion.div
          className="relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden glass rounded-[3rem] p-12 flex flex-col items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/5">
             <div className="flex flex-col items-center gap-8">
               <div className="flex items-center gap-4">
                 <h2 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter italic">
                   {current.word}
                 </h2>
               </div>
               <div className="flex items-center gap-6">
                 <button className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-inner">
                   <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   </svg>
                 </button>
                 <button className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-inner">
                   <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   </svg>
                 </button>
               </div>
               <span className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">
                 Tap to Flip
               </span>
             </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden glass rounded-[3rem] p-12 flex flex-col justify-center border-2 border-primary/40 shadow-2xl rotate-y-180 bg-primary/[0.02]">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/50">
                  {current.type}
                </span>
                <span className="text-sm font-bold text-primary italic">Definition & Usage</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-4xl text-foreground font-arabic leading-[1.6] dir-rtl text-right font-bold">
                  {current.definition}
                </p>
              </div>

              <div className="pt-8 border-t border-border/20 space-y-4">
                <p className="text-sm text-muted-foreground italic leading-relaxed font-medium">
                   "{current.example}"
                </p>
                <div className="flex flex-col gap-2">
                   <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Practical Examples</p>
                   <div className="space-y-1 opacity-60">
                      <p className="text-xs text-foreground font-medium">• Learning {current.word} is essential for mastery.</p>
                      <p className="text-xs text-foreground font-medium">• Ali Jitam explains the {current.word} clearly.</p>
                      <p className="text-xs text-foreground font-medium">• Practice {current.word} everyday with our AI.</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-12 pt-8">
        <button 
          onClick={prev}
          className="h-16 w-16 rounded-[2rem] glass flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <svg className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
           <p className="text-lg font-black text-foreground">{index + 1} <span className="text-muted-foreground opacity-30">/</span> {words.length}</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Words in Unit</p>
        </div>

        <button 
          onClick={next}
          className="h-16 w-16 rounded-[2rem] glass flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <svg className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
