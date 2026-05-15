"use client";
// src/components/study/FlashcardDeck.tsx — v2
// Adds: VoiceButton, AITutorPanel, ConfettiEffect, Framer Motion, swipe gestures.

import React, { useState, useCallback, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast }                   from "sonner";
import { rateWord, type SrsRating } from "@/app/actions/study";
import VoiceButton                 from "./VoiceButton";
import AITutorPanel                from "./AITutorPanel";
import ConfettiEffect, { type ConfettiHandle } from "./ConfettiEffect";
import { cn }                      from "@/lib/utils";

export interface FlashcardWord {
  id: string; word: string; type: string; definition: string;
  example: string; phonetic: string | null; difficulty: number;
}

interface FlashcardDeckProps {
  words:       FlashcardWord[];
  unitTitle:   string;
  levelNumber: number;
  unitNumber:  number;
}

const SRS_BUTTONS: {
  rating: SrsRating; label: string; sub: string;
  color: string; bg: string; border: string;
}[] = [
  { rating: 1, label: "Unknown",  sub: "Review soon",   color: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
  { rating: 2, label: "Medium",   sub: "Getting there", color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  { rating: 3, label: "Strong",   sub: "Mastered!",     color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
];

const TYPE_COLORS: Record<string, string> = {
  noun: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  verb: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  adjective: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  adverb: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  phrase: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function MasteryBadge({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Mastery level ${level} of 3`}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn(
          "h-1.5 w-4 rounded-full transition-colors duration-500",
          i < level ? "bg-primary shadow-sm shadow-primary/50" : "bg-muted"
        )} />
      ))}
    </div>
  );
}

function CompletionScreen({ words, xpTotal, onRestart }: {
  words: FlashcardWord[]; xpTotal: number; onRestart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
        className="relative"
      >
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 border-2 border-primary/50 flex items-center justify-center shadow-xl shadow-primary/20">
          <span className="text-5xl">🎓</span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center text-sm font-bold text-black shadow-lg"
        >★</motion.div>
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold gradient-text">Unit Complete!</h2>
        <p className="text-muted-foreground">
          You reviewed all <span className="text-foreground font-semibold">{words.length} words</span>
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-full text-sm font-semibold mt-1"
        >
          ⚡ +{xpTotal} XP earned this session
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={onRestart}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:scale-95">
          🔁 Review Again
        </button>
        <a href="/dashboard"
          className="flex items-center gap-2 border border-border text-foreground px-5 py-3 rounded-xl font-medium text-sm hover:bg-muted transition-colors active:scale-95">
          🏠 Dashboard
        </a>
      </div>
    </motion.div>
  );
}

export default function FlashcardDeck({
  words: initialWords, unitTitle, levelNumber, unitNumber,
}: FlashcardDeckProps) {
  const [words]           = useState(initialWords);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped]     = useState(false);
  const [isDone, setIsDone]           = useState(false);
  const [masteryMap, setMasteryMap]   = useState<Record<string, number>>({});
  const [sessionXp, setSessionXp]     = useState(0);
  const [isPending, startTransition]  = useTransition();
  const [dragStart, setDragStart]     = useState<number | null>(null);
  const confettiRef = useRef<ConfettiHandle>(null);

  const currentWord = words[index];
  const progress    = Math.round((index / words.length) * 100);

  const handleFlip = useCallback(() => {
    if (!isPending) setIsFlipped((f) => !f);
  }, [isPending]);

  const handleRate = useCallback((rating: SrsRating) => {
    if (!isFlipped || isPending) return;
    startTransition(async () => {
      try {
        const result = await rateWord({ wordId: currentWord.id, rating });
        setMasteryMap((m) => ({ ...m, [currentWord.id]: result.masteryLevel }));
        setSessionXp((x) => x + result.xpEarned);

        const emoji = ["🔁", "🔶", "✅", "⚡"][rating - 1];
        toast.success(`${emoji} +${result.xpEarned} XP`, { duration: 1000 });
      } catch {
        toast.error("Failed to save progress");
      }

      setIsFlipped(false);
      setTimeout(() => {
        if (index + 1 >= words.length) {
          setIsDone(true);
          setTimeout(() => confettiRef.current?.fire(), 100);
        } else {
          setIndex((i) => i + 1);
        }
      }, 250);
    });
  }, [isFlipped, isPending, currentWord, index, words.length]);

  const handleRestart = useCallback(() => {
    setIndex(0); setIsFlipped(false); setIsDone(false); setSessionXp(0);
  }, []);

  // Touch swipe: up = flip
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (dragStart === null) return;
    const dy = dragStart - e.changedTouches[0].clientY;
    if (dy > 40) handleFlip(); // swipe up to flip
    setDragStart(null);
  }, [dragStart, handleFlip]);

  // Keyboard
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDone || isPending) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleFlip(); }
      if (isFlipped) {
        if (e.key === "1") handleRate(1);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(3);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, isDone, isPending, handleFlip, handleRate]);

  if (isDone) return (
    <>
      <ConfettiEffect ref={confettiRef} />
      <CompletionScreen words={words} xpTotal={sessionXp} onRestart={handleRestart} />
    </>
  );

  const typeClass = TYPE_COLORS[currentWord.type] ?? TYPE_COLORS.other;
  const mastery   = masteryMap[currentWord.id] ?? 0;

  return (
    <div className="space-y-5">
      <ConfettiEffect ref={confettiRef} />

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{unitTitle}</span>
          <span><span className="text-foreground font-semibold">{index + 1}</span> / {words.length}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ background: "linear-gradient(90deg,#6366f1,#818cf8)", boxShadow: "0 0 8px rgba(99,102,241,0.5)" }}
          />
        </div>
        <div className="flex gap-1">
          {words.map((w, i) => (
            <div key={w.id} className={cn(
              "h-1 flex-1 min-w-[4px] max-w-[24px] rounded-full transition-all duration-500",
              i < index
                ? (masteryMap[w.id] >= 3 ? "bg-emerald-500"
                  : masteryMap[w.id] >= 1 ? "bg-primary/70" : "bg-primary/30")
                : i === index ? "bg-primary animate-pulse-slow"
                : "bg-muted"
            )} />
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div
            className="card-scene w-full select-none"
            style={{ height: "clamp(340px, 45vw, 440px)" }}
            onClick={handleFlip}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && handleFlip()}
            aria-label={isFlipped ? "Card back" : "Card front — tap to reveal"}
          >
            <div className={cn("card-flip w-full h-full", isFlipped && "is-flipped")}>

              {/* ── FRONT ── */}
              <div className="card-face glass border border-border/50 flex flex-col items-center justify-center p-8 gap-5">
                <div className="absolute top-4 right-4"><MasteryBadge level={mastery} /></div>
                <div className="absolute top-4 left-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < currentWord.difficulty ? "bg-primary/60" : "bg-muted")} />
                  ))}
                </div>

                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight">{currentWord.word}</h2>
                    <VoiceButton word={currentWord.word} size="lg" />
                  </div>
                  <span className={cn("inline-block border rounded-md px-3 py-0.5 text-xs font-semibold font-mono uppercase tracking-wider", typeClass)}>
                    {currentWord.type}
                  </span>
                </div>

                <motion.p
                  className="absolute bottom-5 text-xs text-muted-foreground/40 flex items-center gap-1.5"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span>↑</span> Tap or swipe up to reveal
                </motion.p>
              </div>

              {/* ── BACK ── */}
              <div
                className="card-face card-face--back glass border border-primary/20 flex flex-col justify-between p-6 sm:p-8"
                style={{ background: "linear-gradient(135deg, hsl(222 40% 11%), hsl(239 40% 14%))" }}
              >
                <div className="absolute inset-0 rounded-[1.25rem] overflow-hidden pointer-events-none">
                  <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                </div>

                <div className="relative space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-bold text-foreground">{currentWord.word}</span>
                    <VoiceButton word={currentWord.word} size="sm" />
                    <span className={cn("border rounded px-2 py-0.5 text-xs font-mono", typeClass)}>{currentWord.type}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Definition</p>
                    <p className="text-base text-foreground leading-relaxed">{currentWord.definition}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Example</p>
                    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground text-sm leading-relaxed">
                      "{currentWord.example}"
                    </blockquote>
                  </div>
                </div>

                <div className="relative">
                  {/* AI Tutor button */}
                  <div className="flex justify-center mb-3">
                    <AITutorPanel
                      word={currentWord.word}
                      type={currentWord.type}
                      definition={currentWord.definition}
                      example={currentWord.example}
                    />
                  </div>

                  {/* SRS buttons */}
                  <p className="text-[11px] text-muted-foreground text-center mb-2">
                    How well did you remember this? <span className="opacity-40 hidden sm:inline">(1–4)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {SRS_BUTTONS.map((btn) => (
                      <button
                        key={btn.rating}
                        onClick={(e) => { e.stopPropagation(); handleRate(btn.rating); }}
                        disabled={isPending}
                        className={cn(
                          "srs-btn flex flex-col items-center gap-0.5 py-3 rounded-xl border font-medium text-sm",
                          "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg",
                          "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                          btn.bg, btn.border, btn.color
                        )}
                      >
                        <span className="text-sm sm:text-base font-bold">{btn.label}</span>
                        <span className="text-[10px] opacity-60">{btn.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/40" />
            L{levelNumber} · U{unitNumber}
          </span>
          {sessionXp > 0 && (
            <span className="text-amber-400 font-semibold flex items-center gap-1">⚡ {sessionXp} XP</span>
          )}
          {isPending && <span className="text-primary animate-pulse">Saving…</span>}
        </div>
        <div className="hidden sm:flex gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Space</kbd>
          <span className="opacity-50">flip</span>
          <span className="opacity-30 mx-0.5">|</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">1-3</kbd>
          <span className="opacity-50">rate</span>
        </div>
      </div>
    </div>
  );
}
