"use client";
// =====================================================================
//  src/components/study/AITutorPanel.tsx
//  Slide-up panel powered by Gemini with LOCAL FALLBACK
//  Never shows "AI Unavailable" — falls back to local data seamlessly
//  Designed by Ali Jitam ❤️
// =====================================================================

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AITutorPanelProps {
  word:       string;
  type:       string;
  definition: string;
  example:    string;
}

// ── Type-safe response shapes ────────────────────────────────────────

interface AiData {
  meaning: string;
  story: string;
  mnemonic: string;
  context_engine: { style: string; english: string; arabic: string }[];
}

// ── Word Type → Color (Nouns=Orange, Verbs=Blue, Adjectives=Purple) ──
const TYPE_BADGE_COLORS: Record<string, string> = {
  noun:        "bg-orange-500 text-white",
  verb:        "bg-blue-500 text-white",
  adjective:   "bg-purple-500 text-white",
  adverb:      "bg-teal-500 text-white",
  preposition: "bg-pink-500 text-white",
  phrase:      "bg-cyan-500 text-white",
  other:       "bg-slate-500 text-white",
};

// ── Arabic word type mapping for local fallback ──
const TYPE_ARABIC: Record<string, string> = {
  noun: "اسم", verb: "فعل", adjective: "صفة", adverb: "ظرف",
  preposition: "حرف جر", pronoun: "ضمير", conjunction: "حرف عطف",
  phrase: "عبارة", other: "أخرى",
};

// ── Generate local fallback when AI fails ────────────────────────────
function generateLocalFallback(word: string, type: string, definition: string, example: string): AiData {
  const arabicType = TYPE_ARABIC[type.toLowerCase()] ?? TYPE_ARABIC.other;
  return {
    meaning: `${definition}`,
    story: `تعلمت كلمة "${word}" الجديدة اليوم. هذه الكلمة من نوع ${arabicType} وتستخدم كثيراً في اللغة الإنجليزية. مثال: ${example}`,
    mnemonic: `تذكر كلمة "${word}" من خلال ربطها بالمعنى والسياق الذي تستخدم فيه عادةً`,
    context_engine: [
      { style: "Academic",     english: `The concept of "${word}" is fundamental in academic discourse.`, arabic: `مفهوم "${word}" أساسي في الخطاب الأكاديمي.` },
      { style: "Casual",       english: example || `I use the word "${word}" every day.`,                 arabic: `أستخدم كلمة "${word}" كل يوم.` },
      { style: "Professional", english: `Understanding "${word}" is essential for professional success.`, arabic: `فهم "${word}" ضروري للنجاح المهني.` },
    ],
  };
}

// ── Renderers ─────────────────────────────────────────────────────────

function MentorView({ data, englishWord, wordType, isOffline }: { data: AiData; englishWord: string; wordType: string; isOffline: boolean }) {
  const badgeColor = TYPE_BADGE_COLORS[wordType.toLowerCase()] ?? TYPE_BADGE_COLORS.other;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Word Type Badge — Boldly Colored */}
      <div className="flex items-center gap-2 justify-end" dir="ltr">
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", badgeColor)}>
          {wordType}
        </span>
        {isOffline && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Local Mode
          </span>
        )}
      </div>

      {/* Meaning & Mnemonic */}
      <div className="space-y-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="text-base">💡</span> المعنى في السياق
          </p>
          <p className="text-sm text-foreground leading-relaxed font-arabic">{data.meaning}</p>
        </div>
        
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <span className="text-base">🧠</span> حيلة للحفظ
          </p>
          <p className="text-sm text-foreground leading-relaxed font-arabic">{data.mnemonic}</p>
        </div>
      </div>

      {/* Story */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📖 قصة قصيرة</p>
        <blockquote className="text-base text-foreground leading-loose glass rounded-xl p-5 border border-primary/20 relative">
          <div className="absolute top-3 right-4 text-4xl text-primary/20 font-serif leading-none">&ldquo;</div>
          <p className="pr-4 relative z-10 font-arabic">
            {data.story.split(new RegExp(`(${englishWord})`, 'gi')).map((part, i) => 
              part.toLowerCase() === englishWord.toLowerCase() 
                ? <span key={i} className="text-primary font-bold font-sans px-1" dir="ltr">{part}</span>
                : part
            )}
          </p>
        </blockquote>
      </div>

      {/* Context Engine */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">⚙️ محرك السياق (Context Engine)</p>
        <div className="space-y-2">
          {data.context_engine?.map((ctx, i) => (
            <div key={i} className="glass rounded-lg border border-border/50 p-3 space-y-1.5" dir="ltr">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{ctx.style}</span>
              </div>
              <p className="text-sm text-foreground font-medium">{ctx.english}</p>
              <p className="text-sm text-muted-foreground font-arabic" dir="rtl">{ctx.arabic}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function AITutorPanel({ word, type, definition, example }: AITutorPanelProps) {
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [cache,     setCache]     = useState<AiData | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchExplanation = useCallback(async () => {
    if (cache) return; // already fetched
    setLoading(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ word, type, definition, example }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.error ?? "AI failed");
      setCache(json.data);
      setIsOffline(false);
    } catch {
      // ── SAFETY NET: Never show errors, use local fallback ──
      console.warn(`[AITutor] Falling back to local for: ${word}`);
      const fallback = generateLocalFallback(word, type, definition, example);
      setCache(fallback);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [word, type, definition, example, cache]);

  const handleOpen = () => {
    setOpen(true);
    fetchExplanation();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleOpen(); }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
          "bg-violet-500/10 border-violet-500/30 text-violet-300",
          "hover:bg-violet-500/20 hover:border-violet-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10"
        )}
        aria-label="Open AI Tutor"
      >
        <span>✨</span>
        Magic AI
      </button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] flex flex-col glass border-t border-border/60 rounded-t-3xl overflow-hidden"
              style={{ background: "hsl(222 40% 10% / 0.98)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 shrink-0">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-semibold">{word}</span>
                    <span className="text-sm font-normal text-muted-foreground">—</span>
                    ✨ Elite Mentor
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">اللغة العربية</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 rounded-xl shimmer" />
                    ))}
                  </div>
                ) : cache ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="mentor-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MentorView data={cache} englishWord={word} wordType={type} isOffline={isOffline} />
                    </motion.div>
                  </AnimatePresence>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
