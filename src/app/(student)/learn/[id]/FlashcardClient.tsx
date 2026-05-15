"use client";

// =====================================================================
//  FlashcardClient.tsx — Foundation Protocol Edition
//  Features:
//  - 3-Button SRS: Unknown / Medium / Strong
//  - Linear A→Z progression (no skip, no back)
//  - currentWordIndex persistence
//  - Color-coded word types (Nouns=Orange, Verbs=Blue, Adjectives=Purple)
//  - Speaker 🔊 only (no Mic 🎤)
//  - AI Tutor panel with fallback
//  - Confetti on unit completion
//  Designed by Ali Jitam ❤️
// =====================================================================

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { rateWord, saveWordProgress, completeUnit, type SrsRating } from "@/app/actions/study";
import { useSession } from "next-auth/react";
import AITutorPanel from "@/components/study/AITutorPanel";
import VoiceButton from "@/components/study/VoiceButton";

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

// ── Word Type → Color map (Nouns=Orange, Verbs=Blue, Adjectives=Purple) ──
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  noun:        { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", badge: "bg-orange-500" },
  verb:        { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   badge: "bg-blue-500"   },
  adjective:   { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", badge: "bg-purple-500" },
  adverb:      { bg: "bg-teal-500/10",   text: "text-teal-400",   border: "border-teal-500/30",   badge: "bg-teal-500"   },
  preposition: { bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/30",   badge: "bg-pink-500"   },
  phrase:      { bg: "bg-cyan-500/10",    text: "text-cyan-400",   border: "border-cyan-500/30",   badge: "bg-cyan-500"   },
  other:       { bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  badge: "bg-slate-500"  },
};

function getTypeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? TYPE_COLORS.other;
}

// ── 3-Button SRS Config ──────────────────────────────────────────────
const SRS_BUTTONS: { label: string; sub: string; rating: SrsRating; color: string; icon: string; glow: string }[] = [
  { label: "Unknown",  sub: "Review soon",   rating: 1, color: "from-rose-500 to-red-600",     icon: "🔴", glow: "shadow-rose-500/30"    },
  { label: "Medium",   sub: "Getting there",  rating: 2, color: "from-amber-500 to-yellow-600", icon: "🟡", glow: "shadow-amber-500/30"   },
  { label: "Strong",   sub: "Mastered!",       rating: 3, color: "from-emerald-500 to-green-600",icon: "🟢", glow: "shadow-emerald-500/30" },
];

// ── Confetti Particle Generator ──────────────────────────────────────
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
          <p className="text-gold font-black text-xl mt-4">+50 XP Bonus! ⚡</p>
          <a href="/dashboard" className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
            Return to Path →
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Flashcard Engine ────────────────────────────────────────────
export default function FlashcardClient({
  words,
  unitId,
  unitTitle,
  levelNumber,
  unitNumber,
  initialWordIndex = 0,
}: {
  words: EnrichedWord[];
  unitId: number;
  unitTitle: string;
  levelNumber: number;
  unitNumber: number;
  initialWordIndex?: number;
}) {
  const { data: session } = useSession();
  const [index, setIndex] = useState(Math.min(initialWordIndex, words.length - 1));
  const [maxUnlocked, setMaxUnlocked] = useState(Math.min(initialWordIndex, words.length - 1));
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [lastXp, setLastXp] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = words[index];
  const isLast = index === words.length - 1;
  const isMastered = masteredIds.has(current.id);
  const isRated = ratedIds.has(current.id);
  const typeColor = getTypeColor(current.type);
  const progress = Math.round(((maxUnlocked + 1) / words.length) * 100);

  // ── Rate word + save progress + advance ────────────────────────────
  const handleRate = useCallback((rating: SrsRating) => {
    if (isRated) return; // Already rated this word in this session visit

    startTransition(async () => {
      try {
        const result = await rateWord({
          wordId: current.id,
          rating,
          userId: session?.user?.id,
          unitId,
        });

        setLastXp(result.xpEarned);
        setRatedIds(prev => new Set(prev).add(current.id));

        if (result.masteryLevel >= 3) {
          setMasteredIds(prev => new Set(prev).add(current.id));
        }

        // Save word progress (advance currentWordIndex)
        const newIndex = index + 1;
        if (newIndex <= words.length) {
          await saveWordProgress({
            userId: session?.user?.id,
            unitId,
            newIndex: Math.min(newIndex, words.length - 1),
          });
        }

        // Unlock next word
        if (index + 1 < words.length) {
          setMaxUnlocked(prev => Math.max(prev, index + 1));
        }

        setTimeout(() => setLastXp(null), 2000);

        // Auto-advance after a short delay
        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => {
            if (index + 1 >= words.length) {
              // Complete the unit!
              completeUnit({ userId: session?.user?.id, unitId });
              setShowConfetti(true);
            } else {
              setIndex(prev => prev + 1);
            }
          }, 250);
        }, 600);

      } catch (e) {
        console.error("Failed to rate word:", e);
      }
    });
  }, [current.id, index, isRated, session?.user?.id, unitId, words.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showConfetti) return;
      if (e.key === " ") { e.preventDefault(); setIsFlipped(f => !f); }
      if (isFlipped && !isRated) {
        if (e.key === "1") handleRate(1);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(3);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, isRated, handleRate, showConfetti]);

  if (showConfetti) {
    return <ConfettiExplosion />;
  }

  return (
    <div className="flex flex-col items-center gap-8 py-4">
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

      {/* ── Progress Bar ── */}
      <div className="w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold/50">
              L{levelNumber} · U{unitNumber}
            </span>
            <span className="text-foreground">{unitTitle}</span>
          </span>
          <span>
            <span className="text-foreground font-black tabular-nums">{index + 1}</span>
            <span className="text-muted-foreground/40 mx-1">/</span>
            <span>{words.length}</span>
          </span>
        </div>
        <div className="h-2.5 w-full bg-muted/20 rounded-full overflow-hidden border border-border/20">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ boxShadow: "0 0 12px rgba(16,185,129,0.4)" }}
          />
        </div>

        {/* Word dots */}
        <div className="flex gap-1 flex-wrap justify-center">
          {words.map((w, i) => (
            <div
              key={w.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === index
                  ? "bg-primary w-6 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  : masteredIds.has(w.id)
                    ? "bg-gold w-3"
                    : ratedIds.has(w.id)
                      ? "bg-primary/50 w-3"
                      : i <= maxUnlocked
                        ? "bg-muted/40 w-3"
                        : "bg-muted/15 w-2"
              )}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <span>📚 {ratedIds.size} reviewed</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-gold">⭐ {masteredIds.size} mastered</span>
        </div>
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
            {/* Word Type Badge — Boldly Colored */}
            <div className="absolute top-6 left-6">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                typeColor.bg, typeColor.text, typeColor.border
              )}>
                <span className={cn("h-2 w-2 rounded-full", typeColor.badge)} />
                {current.type}
              </span>
            </div>

            {/* Mastered Badge */}
            {isMastered && (
              <div className="absolute top-6 right-6 bg-gold/10 border border-gold/20 text-gold text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                ⭐ Mastered
              </div>
            )}

            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-7xl md:text-9xl font-black text-foreground tracking-tighter italic text-center leading-none">
                  {current.word}
                </h2>
                <span className={cn(
                  "text-sm font-black uppercase tracking-[0.3em]",
                  typeColor.text
                )}>
                  {current.type}
                </span>
              </div>

              {/* Speaker Only — No Mic 🎤 */}
              <div className="flex items-center gap-4">
                <VoiceButton word={current.word} size="lg" />
              </div>

              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/25">
                Tap to Reveal · Space to Flip · 1-3 Rate
              </span>
            </div>
          </div>

          {/* ─── BACK ─── */}
          <div
            className="absolute inset-0 w-full elite-card rounded-[3rem] p-6 md:p-10 flex flex-col justify-start border-2 border-gold/15 shadow-2xl min-h-[420px] overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-4">
              {/* Word + Type (boldly colored) */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-black text-foreground">{current.word}</h3>
                  <VoiceButton word={current.word} size="sm" />
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                    typeColor.bg, typeColor.text, typeColor.border
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", typeColor.badge)} />
                    {current.type}
                  </span>
                </div>
                <span className={cn(
                  "text-sm font-black border rounded-lg px-2.5 py-1",
                  typeColor.bg, typeColor.text, typeColor.border
                )} dir="rtl">
                  {current.aiData.posArabic}
                </span>
              </div>

              {/* Arabic Translation */}
              <div className="space-y-1.5 pb-3 border-b border-border/20">
                <p className="text-[8px] font-black text-gold/50 uppercase tracking-[0.4em]">الترجمة</p>
                <p className="text-2xl md:text-3xl text-foreground leading-[1.8] font-bold text-right" dir="rtl">
                  {current.aiData.translation}
                </p>
              </div>

              {/* Definition */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-black text-primary/50 uppercase tracking-[0.4em]">Definition</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{current.definition}</p>
              </div>

              {/* Example Sentence (Video Sentence) */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-black text-blue-400/50 uppercase tracking-[0.4em]">Example Sentence</p>
                <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{current.example}&rdquo;
                </blockquote>
              </div>

              {/* Rule of 3 Examples */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[8px] font-black text-emerald-500/70 uppercase tracking-[0.3em]">أمثلة عملية</p>
                  <div className="flex-1 h-px bg-border/20" />
                  <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Rule of 3</span>
                </div>

                {current.aiData.examples.map((ex, i) => (
                  <div key={i} className="elite-card rounded-xl p-3 border border-border/30 hover:border-gold/20 transition-colors space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-md bg-gold/10 flex items-center justify-center text-[9px] font-black text-gold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-foreground font-semibold leading-relaxed">{ex.english}</p>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed text-right" dir="rtl">{ex.arabic}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Tutor */}
              <div className="flex justify-center pt-2">
                <AITutorPanel
                  word={current.word}
                  type={current.type}
                  definition={current.definition}
                  example={current.example}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ 3-BUTTON SRS RATING ═══ */}
      <div className="w-full max-w-2xl">
        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] text-center mb-3">
          {isFlipped && !isRated
            ? "How well do you know this word? (1-3)"
            : isRated
              ? "✅ Rated — advancing..."
              : "Flip the card to rate"}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {SRS_BUTTONS.map((btn) => (
            <button
              key={btn.rating}
              onClick={(e) => { e.stopPropagation(); handleRate(btn.rating); }}
              disabled={isPending || !isFlipped || isRated}
              className={cn(
                "srs-btn py-4 rounded-2xl text-white font-bold text-sm bg-gradient-to-b shadow-lg transition-all border border-white/10",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100",
                isFlipped && !isRated
                  ? `hover:scale-105 hover:shadow-xl active:scale-95 ${btn.glow}`
                  : "",
                btn.color
              )}
            >
              <span className="block text-xl mb-1">{btn.icon}</span>
              <span className="block font-black text-sm">{btn.label}</span>
              <span className="block text-[10px] opacity-60 mt-0.5">{btn.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
        <kbd className="px-1.5 py-0.5 rounded border border-border/30 font-mono text-[9px]">Space</kbd>
        <span>flip</span>
        <span className="mx-1">·</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border/30 font-mono text-[9px]">1-3</kbd>
        <span>rate</span>
      </div>
    </div>
  );
}
