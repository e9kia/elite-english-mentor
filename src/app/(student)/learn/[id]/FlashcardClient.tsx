"use client";
// =====================================================================
//  FlashcardClient.tsx — Pure DB Edition
//  3 Arabic SRS Buttons: جديدة / نص نص / أعرفها
//  Zero AI latency · Elite Midnight Gold
//  Designed by Ali Jitam ❤️
// =====================================================================

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { rateWord, saveWordProgress, completeUnit, type SrsRating } from "@/app/actions/study";
import { useSession } from "next-auth/react";
import VoiceButton from "@/components/study/VoiceButton";
import StoryReader from "@/components/study/StoryReader";

interface EnrichedWord {
  id: string; word: string; type: string; definition: string; example: string;
  meaningArabic: string; typeArabic: string; sentenceArabic: string;
  sentence2: string | null; sentence3: string | null; sentence4: string | null;
  sentence2Arabic: string | null; sentence3Arabic: string | null; sentence4Arabic: string | null;
  ipa: string | null; collocations: string | null; antonyms: string | null; synonyms: string | null;
}

// ── Word Type → Color ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  noun:        { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", badge: "bg-orange-500" },
  verb:        { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30",   badge: "bg-blue-500"   },
  adjective:   { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", badge: "bg-purple-500" },
  adverb:      { bg: "bg-teal-500/10",   text: "text-teal-400",   border: "border-teal-500/30",   badge: "bg-teal-500"   },
  preposition: { bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/30",   badge: "bg-pink-500"   },
  phrase:      { bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/30",   badge: "bg-cyan-500"   },
  other:       { bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  badge: "bg-slate-500"  },
};

function getTypeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? TYPE_COLORS.other;
}

// ── 3 Arabic SRS Buttons (Luxury Space) ──────────────────────────────
const SRS_BUTTONS: { label: string; sub: string; rating: SrsRating; borderGlow: string; dotColor: string }[] = [
  { label: "جديدة",    sub: "New Word",       rating: 1, borderGlow: "border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/10", dotColor: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" },
  { label: "نص نص",    sub: "Half-Half",      rating: 2, borderGlow: "border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10", dotColor: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" },
  { label: "أعرفها",   sub: "I Know It",      rating: 3, borderGlow: "border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10", dotColor: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" },
];

// ── Confetti ─────────────────────────────────────────────────────────
function ConfettiExplosion() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: -(Math.random() * 500 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 1 + 0.5,
      color: ["#C8A961", "#F59E0B", "#6366f1", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"][Math.floor(Math.random() * 7)],
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
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="absolute inset-0 flex items-center justify-center px-4"
      >
        <div className="elite-card rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-16 text-center border-2 border-gold/20 shadow-2xl pointer-events-auto glow-gold max-w-md w-full">
          <p className="text-6xl sm:text-7xl mb-4 sm:mb-6">🎉</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3 tracking-tighter">Unit Complete!</h2>
          <p className="text-base sm:text-lg text-muted-foreground font-bold italic">
            Ali Jitam ❤️ is proud of your excellence.
          </p>
          <p className="text-gold font-black text-lg sm:text-xl mt-4">+50 XP Bonus! ⚡</p>
          <a href="/dashboard" className="inline-block mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
            Return to Dashboard →
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function FlashcardClient({
  words, unitId, unitTitle, levelNumber, unitNumber, initialWordIndex = 0, story
}: {
  words: EnrichedWord[]; unitId: number; unitTitle: string;
  levelNumber: number; unitNumber: number; initialWordIndex?: number; story?: any;
}) {
  const { data: session } = useSession();
  const [index, setIndex] = useState(Math.min(initialWordIndex, words.length - 1));
  const [maxUnlocked, setMaxUnlocked] = useState(Math.min(initialWordIndex, words.length - 1));
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [lastXp, setLastXp] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = words[index];
  const isRated = ratedIds.has(current.id);
  const isMastered = masteredIds.has(current.id);
  const typeColor = getTypeColor(current.type);
  const progress = Math.round(((maxUnlocked + 1) / words.length) * 100);

  // Collect additional sentences for display
  const additionalSentences = [current.sentence2, current.sentence3, current.sentence4].filter(Boolean) as string[];

  const handleRate = useCallback((rating: SrsRating) => {
    if (isRated) return;
    startTransition(async () => {
      try {
        const result = await rateWord({ wordId: current.id, rating, userId: session?.user?.id, unitId });
        setLastXp(result.xpEarned);
        setRatedIds(prev => new Set(prev).add(current.id));
        if (result.masteryLevel >= 3) setMasteredIds(prev => new Set(prev).add(current.id));

        const newIndex = index + 1;
        if (newIndex <= words.length) {
          await saveWordProgress({ userId: session?.user?.id, unitId, newIndex: Math.min(newIndex, words.length - 1) });
        }
        if (index + 1 < words.length) setMaxUnlocked(prev => Math.max(prev, index + 1));
        setTimeout(() => setLastXp(null), 2000);

        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => {
            if (index + 1 >= words.length) {
              if (story) {
                setShowStory(true);
              } else {
                completeUnit({ userId: session?.user?.id, unitId });
                setShowConfetti(true);
              }
            } else {
              setIndex(prev => prev + 1);
            }
          }, 250);
        }, 500);
      } catch (e) {
        console.error("Failed to rate word:", e);
      }
    });
  }, [current.id, index, isRated, session?.user?.id, unitId, words.length]);

  // Keyboard
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
  }, [isFlipped, isRated, handleRate, showConfetti, showStory]);

  if (showConfetti) return <ConfettiExplosion />;

  if (showStory && story) {
    return (
      <StoryReader
        story={story}
        words={words}
        unitId={unitId}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 py-2 sm:py-4">
      {/* XP Toast */}
      <AnimatePresence>
        {lastXp !== null && (
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 bg-gradient-to-r from-primary to-gold text-primary-foreground px-5 py-2.5 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30"
          >
            +{lastXp} XP ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gold/50">L{levelNumber} · U{unitNumber}</span>
            <span className="text-foreground hidden sm:inline">{unitTitle}</span>
          </span>
          <span>
            <span className="text-foreground font-black tabular-nums">{index + 1}</span>
            <span className="text-muted-foreground/40 mx-1">/</span>
            <span>{words.length}</span>
          </span>
        </div>
        <div className="h-2 sm:h-2.5 w-full bg-muted/20 rounded-full overflow-hidden border border-border/20">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ boxShadow: "0 0 12px hsl(var(--gold) / 0.4)" }}
          />
        </div>
        {/* Word dots */}
        <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
          {words.map((w, i) => (
            <div key={w.id} className={cn(
              "h-1 sm:h-1.5 rounded-full transition-all duration-500",
              i === index ? "bg-primary w-4 sm:w-6 shadow-[0_0_8px_hsl(var(--gold)/0.5)]"
                : masteredIds.has(w.id) ? "bg-gold w-2 sm:w-3"
                : ratedIds.has(w.id) ? "bg-primary/50 w-2 sm:w-3"
                : i <= maxUnlocked ? "bg-muted/40 w-2 sm:w-3" : "bg-muted/15 w-1.5 sm:w-2"
            )} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
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
            className="w-full elite-card gradient-shine rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 flex flex-col items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/5 min-h-[320px] sm:min-h-[420px]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border",
                typeColor.bg, typeColor.text, typeColor.border)}>
                <span className={cn("h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full", typeColor.badge)} />
                {current.type}
              </span>
            </div>
            {isMastered && (
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-gold/10 border border-gold/20 text-gold text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">⭐ Mastered</div>
            )}
            <div className="flex flex-col items-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <h2 className="text-5xl sm:text-7xl md:text-9xl font-black text-foreground tracking-tighter italic text-center leading-none">{current.word}</h2>
                <span className={cn("text-xs sm:text-sm font-black uppercase tracking-[0.3em]", typeColor.text)}>{current.type}</span>
                {current.ipa && <span className="text-xs text-muted-foreground/40 font-mono">{current.ipa}</span>}
              </div>
              <VoiceButton word={current.word} size="lg" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-muted-foreground/25">Tap to Reveal</span>
            </div>
          </div>

          {/* ─── BACK ─── */}
          <div
            className="absolute inset-0 w-full elite-card rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 md:p-10 flex flex-col justify-start border-2 border-gold/15 shadow-2xl min-h-[320px] sm:min-h-[420px] overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Word + Type */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">{current.word}</h3>
                  <VoiceButton word={current.word} size="sm" />
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border",
                    typeColor.bg, typeColor.text, typeColor.border)}>
                    {current.type}
                  </span>
                </div>
                <span className={cn("text-sm font-black border rounded-lg px-2 py-0.5 sm:py-1", typeColor.bg, typeColor.text, typeColor.border)} dir="rtl">
                  {current.typeArabic}
                </span>
              </div>

              {/* Arabic Translation */}
              <div className="space-y-1 pb-3 border-b border-border/20">
                <p className="text-[8px] font-black text-gold/50 uppercase tracking-[0.4em]">الترجمة</p>
                <p className="text-xl sm:text-2xl md:text-3xl text-foreground leading-[1.8] font-bold text-right" dir="rtl">{current.meaningArabic}</p>
              </div>

              {/* Definition */}
              <div className="space-y-1">
                <p className="text-[8px] font-black text-primary/50 uppercase tracking-[0.4em]">Definition</p>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{current.definition}</p>
              </div>

              {/* Primary Sentence + Arabic */}
              <div className="space-y-1">
                <p className="text-[8px] font-black text-blue-400/50 uppercase tracking-[0.4em]">Example</p>
                <blockquote className="border-l-2 border-primary/30 pl-3 text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{current.example}&rdquo;
                </blockquote>
                {current.sentenceArabic && (
                  <p className="text-xs text-muted-foreground/60 text-right pr-3" dir="rtl">{current.sentenceArabic}</p>
                )}
              </div>

              {/* Additional Contextual Sentences */}
              {additionalSentences.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] font-black text-gold/70 uppercase tracking-[0.3em]">جمل إضافية</p>
                    <div className="flex-1 h-px bg-border/20" />
                  </div>
                  {additionalSentences.map((s, i) => (
                    <div key={i} className="elite-card rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-border/30 hover:border-gold/20 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-gold/10 flex items-center justify-center text-[8px] sm:text-[9px] font-black text-gold shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-[11px] sm:text-xs text-foreground font-medium leading-relaxed">{s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata badges */}
              {(current.collocations || current.antonyms || current.synonyms) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {current.collocations && (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-2.5 py-1 border border-border/20">
                      <span className="font-black text-gold/50 mr-1">Collocations:</span>{current.collocations}
                    </div>
                  )}
                  {current.synonyms && (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-2.5 py-1 border border-border/20">
                      <span className="font-black text-blue-400/50 mr-1">Synonyms:</span>{current.synonyms}
                    </div>
                  )}
                  {current.antonyms && (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-2.5 py-1 border border-border/20">
                      <span className="font-black text-rose-400/50 mr-1">Antonyms:</span>{current.antonyms}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ 3 ARABIC SRS BUTTONS ═══ */}
      <div className="w-full max-w-2xl">
        <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center mb-3">
          {isFlipped && !isRated ? "كيف تعرف هذه الكلمة؟" : isRated ? "✅ تم التقييم — جاري الانتقال..." : "اقلب البطاقة للتقييم"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
          {SRS_BUTTONS.map((btn) => (
            <button
              key={btn.rating}
              onClick={(e) => { e.stopPropagation(); handleRate(btn.rating); }}
              disabled={isPending || !isFlipped || isRated}
              className={cn(
                "group relative w-full flex items-center justify-between sm:flex-col sm:justify-center p-4 sm:py-5 min-h-[48px] sm:min-h-[64px] rounded-xl sm:rounded-2xl transition-all duration-300",
                "bg-neutral-900/90 backdrop-blur-xl border border-white/5",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100",
                isFlipped && !isRated ? `hover:bg-neutral-800/90 active:scale-[0.98] shadow-lg ${btn.borderGlow}` : ""
              )}
            >
              <div className="flex flex-col items-start sm:items-center">
                <span className="block font-black text-sm sm:text-base text-foreground" dir="rtl">{btn.label}</span>
                <span className="block text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{btn.sub}</span>
              </div>
              <span className={cn("h-2.5 w-2.5 sm:mt-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", btn.dotColor)} style={{ boxShadow: `0 0 10px var(--tw-shadow-color)` }} />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
        <kbd className="px-1.5 py-0.5 rounded border border-border/30 font-mono text-[8px] sm:text-[9px] hidden sm:inline">Space</kbd>
        <span className="hidden sm:inline">flip</span>
        <span className="mx-1 hidden sm:inline">·</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border/30 font-mono text-[8px] sm:text-[9px] hidden sm:inline">1-3</kbd>
        <span className="hidden sm:inline">rate</span>
      </div>
    </div>
  );
}
