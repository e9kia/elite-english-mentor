"use client";

// =====================================================================
//  FlashcardClient.tsx — Ali Jitam's Elite 3D Flashcard Engine
//  Features: 3D Flip, Rule of 3 Examples, Mark as Mastered, SRS Buttons,
//  Confetti Celebration, Premium Midnight Emerald & Gold Typography
// =====================================================================

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { rateWord, type SrsRating } from "@/app/actions/study";
import { useSession } from "next-auth/react";

interface FlashcardAIData {
  translation: string;
  posArabic: string;
  examples: { english: string; arabic: string }[];
}

interface EnrichedWord {
  id: string;
  word: string;
  type: string;
  definition: string;
  example: string;
  phonetic?: string | null;
  aiData: FlashcardAIData;
}

// ─── Confetti Particle Generator ─────────────────────────────────────
function ConfettiExplosion() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: -(Math.random() * 500 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 1 + 0.5,
      color: ["#10B981", "#F59E0B", "#6366f1", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"][Math.floor(Math.random() * 7)],
      delay: Math.random() * 0.3,
    })), []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, opacity: 0 }}
          transition={{ duration: 2, delay: p.delay, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="elite-card rounded-[3rem] p-16 text-center border-2 border-gold/20 shadow-2xl pointer-events-auto glow-gold">
          <p className="text-7xl mb-6">🎉</p>
          <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">Unit Complete!</h2>
          <p className="text-lg text-muted-foreground font-bold italic">
            Ali Jitam ❤️ is proud of your excellence.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SRS Rating Button ───────────────────────────────────────────────
const SRS_BUTTONS: { label: string; rating: SrsRating; color: string; icon: string }[] = [
  { label: "Again", rating: 1, color: "from-rose-500 to-red-600 shadow-rose-500/20", icon: "🔄" },
  { label: "Hard", rating: 2, color: "from-amber-500 to-orange-600 shadow-amber-500/20", icon: "😤" },
  { label: "Good", rating: 3, color: "from-blue-500 to-indigo-600 shadow-blue-500/20", icon: "👍" },
  { label: "Easy", rating: 4, color: "from-emerald-500 to-green-600 shadow-emerald-500/20", icon: "⚡" },
];

// ─── Main Flashcard Engine ───────────────────────────────────────────
export default function FlashcardClient({ words }: { words: EnrichedWord[] }) {
  const { data: session } = useSession();
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [lastXp, setLastXp] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = words[index];
  const isLast = index === words.length - 1;
  const isMastered = masteredIds.has(current.id);

  const handleRate = useCallback((rating: SrsRating) => {
    startTransition(async () => {
      try {
        const result = await rateWord({
          wordId: current.id,
          rating,
          userId: session?.user?.id,
        });
        setLastXp(result.xpEarned);
        if (result.masteryLevel >= 3) {
          setMasteredIds(prev => new Set(prev).add(current.id));
        }
        setTimeout(() => setLastXp(null), 2000);
      } catch (e) {
        console.error("Failed to rate word:", e);
      }
    });
  }, [current.id, session?.user?.id]);

  const handleMastered = useCallback(() => {
    handleRate(4);
  }, [handleRate]);

  const next = useCallback(() => {
    setIsFlipped(false);
    if (isLast) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 200);
  }, [isLast, words.length]);

  const prev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev - 1 + words.length) % words.length), 200);
  }, [words.length]);

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
    <div className="flex flex-col items-center gap-10 py-4">
      <AnimatePresence>{showConfetti && <ConfettiExplosion />}</AnimatePresence>

      {/* XP Toast */}
      <AnimatePresence>
        {lastXp !== null && (
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 right-8 z-50 bg-gradient-to-r from-primary to-emerald-600 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30"
          >
            +{lastXp} XP ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Track */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-lg">
        {words.map((w, i) => (
          <button
            key={i}
            onClick={() => { setIsFlipped(false); setIndex(i); }}
            className={cn(
              "h-2 rounded-full transition-all duration-500 cursor-pointer hover:opacity-80",
              i === index
                ? "bg-primary w-12 shadow-[0_0_14px_hsl(var(--primary)/0.5)]"
                : masteredIds.has(w.id)
                  ? "bg-gold w-6"
                  : i < index
                    ? "bg-primary/40 w-6"
                    : "bg-muted/30 w-6"
            )}
          />
        ))}
      </div>

      {/* Mastered counter */}
      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
        <span>📚 {index + 1} / {words.length}</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span className="text-gold">⭐ {masteredIds.size} mastered</span>
      </div>

      {/* ═══ THE 3D FLASHCARD ═══ */}
      <div
        className="relative w-full max-w-2xl cursor-pointer select-none"
        style={{ perspective: "1400px" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* ─── FRONT ─── */}
          <div
            className="w-full elite-card gradient-shine rounded-[3rem] p-12 md:p-20 flex flex-col items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/5 min-h-[420px]"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Mastered Badge */}
            {isMastered && (
              <div className="absolute top-6 right-6 bg-gold/10 border border-gold/20 text-gold text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                ⭐ Mastered
              </div>
            )}
            <div className="flex flex-col items-center gap-10">
              <div className="flex flex-col items-center gap-4">
                {current.phonetic && (
                  <span className="text-sm font-mono text-muted-foreground/50 tracking-wide">{current.phonetic}</span>
                )}
                <h2 className="text-7xl md:text-9xl font-black text-foreground tracking-tighter italic text-center leading-none">
                  {current.word}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">
                  {current.type}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="h-16 w-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg shadow-primary/10 active:scale-90 border border-primary/20"
                  aria-label="Listen to pronunciation"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="h-16 w-16 rounded-[1.25rem] bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg shadow-rose-500/10 active:scale-90 border border-rose-500/20"
                  aria-label="Record your pronunciation"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/25">
                Tap to Reveal · Space to Flip · ← → Navigate
              </span>
            </div>
          </div>

          {/* ─── BACK ─── */}
          <div
            className="absolute inset-0 w-full elite-card rounded-[3rem] p-8 md:p-12 flex flex-col justify-start border-2 border-gold/15 shadow-2xl min-h-[420px] overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-5">
              {/* Header: Type badges */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border/50">
                    {current.type}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20" dir="rtl">
                    {current.aiData.posArabic}
                  </span>
                </div>
                <span className="text-[10px] font-black text-gold italic tracking-wide">الترجمة العربية</span>
              </div>

              {/* Arabic Translation */}
              <div className="space-y-2 pb-4 border-b border-border/20">
                <p className="text-[8px] font-black text-gold/50 uppercase tracking-[0.4em]">المعنى</p>
                <p className="text-3xl md:text-4xl text-foreground leading-[1.8] font-bold text-right" dir="rtl">
                  {current.aiData.translation}
                </p>
              </div>

              {/* Rule of 3 Examples */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[8px] font-black text-emerald-500/70 uppercase tracking-[0.3em]">أمثلة عملية</p>
                  <div className="flex-1 h-px bg-border/20" />
                  <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Rule of 3</span>
                </div>

                {current.aiData.examples.map((ex, i) => (
                  <div key={i} className="group">
                    <div className="elite-card rounded-2xl p-4 border border-border/30 hover:border-gold/20 transition-colors space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-lg bg-gold/10 flex items-center justify-center text-[10px] font-black text-gold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-sm text-foreground font-semibold leading-relaxed">{ex.english}</p>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed text-right" dir="rtl">{ex.arabic}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mark as Mastered Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleMastered(); }}
                disabled={isPending || isMastered}
                className={cn(
                  "w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 active:scale-95",
                  isMastered
                    ? "bg-gold/10 text-gold border border-gold/20 cursor-default"
                    : "bg-gradient-to-r from-gold to-gold-deep text-white shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 border border-gold/30"
                )}
              >
                {isPending ? "Saving..." : isMastered ? "⭐ Mastered" : "⭐ Mark as Mastered"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ SRS RATING BUTTONS ═══ */}
      <div className="w-full max-w-2xl">
        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] text-center mb-3">How well did you know this?</p>
        <div className="grid grid-cols-4 gap-3">
          {SRS_BUTTONS.map((btn) => (
            <button
              key={btn.rating}
              onClick={() => handleRate(btn.rating)}
              disabled={isPending}
              className={cn(
                "srs-btn py-3 rounded-2xl text-white font-bold text-xs bg-gradient-to-b shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 border border-white/10",
                btn.color
              )}
            >
              <span className="block text-lg mb-0.5">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ NAVIGATION CONTROLS ═══ */}
      <div className="flex items-center gap-12 pt-2">
        <button
          onClick={prev}
          className="h-16 w-16 rounded-2xl elite-card flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group active:scale-90 shadow-lg"
          aria-label="Previous word"
        >
          <svg className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center min-w-[100px]">
          <p className="text-2xl font-black text-foreground tabular-nums tracking-tight">
            {index + 1} <span className="text-muted-foreground/15 mx-1">/</span> {words.length}
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground/30 mt-1">Vocabulary</p>
        </div>

        <button
          onClick={next}
          className="h-16 w-16 rounded-2xl elite-card flex items-center justify-center border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group active:scale-90 shadow-lg"
          aria-label="Next word"
        >
          <svg className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
