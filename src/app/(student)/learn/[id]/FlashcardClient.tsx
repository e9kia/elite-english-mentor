"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  const [showConfetti, setShowConfetti] = useState(false);

  const current = words[index];
  const isLast = index === words.length - 1;

  const next = useCallback(() => {
    setIsFlipped(false);
    if (isLast) {
      // Unit complete — trigger confetti!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 150);
  }, [isLast, words.length]);

  const prev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev - 1 + words.length) % words.length), 150);
  }, [words.length]);

  // Keyboard navigation: ← → and Space to flip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") { e.preventDefault(); setIsFlipped(f => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      {/* Confetti on unit completion */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="glass rounded-[3rem] p-12 text-center border-2 border-primary/40 shadow-2xl pointer-events-auto"
          >
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Unit Complete!</h2>
            <p className="text-muted-foreground font-medium">Ali Jitam ❤️ is proud of your progress.</p>
          </motion.div>
        </div>
      )}

      {/* Progress Indicators */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
        {words.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIsFlipped(false); setIndex(i); }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500 cursor-pointer hover:opacity-80",
              i === index
                ? "bg-primary w-10 shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
                : i < index
                  ? "bg-primary/30 w-6"
                  : "bg-muted/40 w-6"
            )}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full max-w-2xl cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* FRONT */}
          <div
            className="w-full glass rounded-[3rem] p-12 md:p-16 flex flex-col items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/5 min-h-[380px]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-3">
                {current.phonetic && (
                  <span className="text-sm font-mono text-muted-foreground/60">{current.phonetic}</span>
                )}
                <h2 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter italic text-center leading-none">
                  {current.word}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mt-2">
                  {current.type}
                </span>
              </div>

              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-inner active:scale-95"
                  aria-label="Listen to pronunciation"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-inner active:scale-95"
                  aria-label="Record pronunciation"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>

              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
                Tap to Flip · ← → to Navigate
              </span>
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 w-full glass rounded-[3rem] p-12 md:p-14 flex flex-col justify-center border-2 border-primary/30 shadow-2xl bg-primary/[0.02] min-h-[380px] overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border/50">
                  {current.type}
                </span>
                <span className="text-xs font-bold text-primary italic tracking-wide">Arabic Translation</span>
              </div>

              {/* Arabic Definition */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em]">المعنى</p>
                <p className="text-3xl md:text-4xl text-foreground font-arabic leading-[1.6] dir-rtl text-right font-bold">
                  {current.definition}
                </p>
              </div>

              {/* Example Usage */}
              {current.example && (
                <div className="pt-6 border-t border-border/20 space-y-3">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Example Usage</p>
                  <p className="text-sm text-muted-foreground italic leading-relaxed font-medium pl-4 border-l-2 border-primary/20">
                    "{current.example}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-10 pt-4">
        <button
          onClick={prev}
          className="h-14 w-14 rounded-2xl glass flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group active:scale-95"
          aria-label="Previous word"
        >
          <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center min-w-[80px]">
          <p className="text-xl font-black text-foreground tabular-nums">
            {index + 1} <span className="text-muted-foreground/20 mx-1">/</span> {words.length}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Vocabulary</p>
        </div>

        <button
          onClick={next}
          className="h-14 w-14 rounded-2xl glass flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group active:scale-95"
          aria-label="Next word"
        >
          <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
