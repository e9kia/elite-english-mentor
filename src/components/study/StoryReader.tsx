"use client";
// =====================================================================
//  src/components/study/StoryReader.tsx
//  Interactive Story Module & Comprehension Quiz
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { completeUnit } from "@/app/actions/study";
import VoiceButton from "@/components/study/VoiceButton";
import { useSession } from "next-auth/react";

interface WordData {
  id: string;
  word: string;
  type: string;
  meaningArabic: string;
}

interface StoryContent {
  en: string;
  ar: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface StoryData {
  id: string;
  title: string;
  content: any; // JSON Array of StoryContent
  quizData: any; // JSON Array of QuizQuestion
}

interface StoryReaderProps {
  story: StoryData;
  words: WordData[];
  unitId: number;
  onComplete?: () => void;
}

// ── Confetti ─────────────────────────────────────────────────────────
function ConfettiExplosion({ onDone }: { onDone?: () => void }) {
  const particles = useMemo(() =>
    Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 800,
      y: -(Math.random() * 600 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 1.5 + 0.5,
      color: ["#C8A961", "#F59E0B", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"][Math.floor(Math.random() * 7)],
      delay: Math.random() * 0.4,
    })), []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-4 h-4 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, opacity: 0 }}
          transition={{ duration: 2.5, delay: p.delay, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
        className="elite-card rounded-[3rem] p-12 text-center border-2 border-gold/30 shadow-2xl pointer-events-auto glow-gold max-w-lg w-full mx-4"
      >
        <p className="text-7xl mb-6">🏆</p>
        <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">Perfect Score!</h2>
        <p className="text-lg text-muted-foreground font-bold italic mb-6">
          Ali Jitam ❤️ is proud of your excellence.
        </p>
        <div className="inline-block bg-gold/10 border border-gold/30 rounded-2xl px-6 py-3 mb-8">
          <p className="text-gold font-black text-2xl">+200 XP Total! ⚡</p>
          <p className="text-xs text-gold/70 font-bold uppercase tracking-widest mt-1">Unit Complete</p>
        </div>
        <button
          onClick={onDone}
          className="block w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          Return to Dashboard →
        </button>
      </motion.div>
    </div>
  );
}

// ── Word Highlight Component ───────────────────────────────────────────
function HighlightedWord({ text, wordInfo }: { text: string; wordInfo: WordData }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="relative inline-block cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}>
      <span className="text-gold font-bold underline decoration-gold/40 decoration-wavy underline-offset-4 transition-colors group-hover:text-gold-light">
        {text}
      </span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-max max-w-[200px] elite-card p-3 rounded-xl shadow-xl border border-gold/20 flex flex-col items-center gap-2"
          >
            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-sm font-black text-foreground">{wordInfo.word}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{wordInfo.type}</span>
              <span className="text-sm text-primary font-bold mt-1" dir="rtl">{wordInfo.meaningArabic}</span>
            </div>
            <VoiceButton word={wordInfo.word} size="sm" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── Sentence Parsing ───────────────────────────────────────────────────
function parseSentence(text: string, words: WordData[]) {
  if (words.length === 0) return <span>{text}</span>;

  // Create a regex to match any of the words (case insensitive, whole words)
  const escapedWords = words.map((w) => w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const matchedWord = words.find((w) => w.word.toLowerCase() === lowerPart);
        if (matchedWord) {
          return <HighlightedWord key={i} text={part} wordInfo={matchedWord} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Main Story Reader ────────────────────────────────────────────────
export default function StoryReader({ story, words, unitId, onComplete }: StoryReaderProps) {
  const { data: session } = useSession();
  const content: StoryContent[] = story.content as any;
  const quizData: QuizQuestion[] = story.quizData as any;

  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const toggleLine = useCallback((idx: number) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleOptionSelect = (qIndex: number, optIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const submitQuiz = async () => {
    if (quizSubmitted) return;
    setQuizSubmitted(true);

    const isAllCorrect = quizData.every((q, i) => quizAnswers[i] === q.answerIndex);

    if (isAllCorrect) {
      setShowConfetti(true);
      await completeUnit({ userId: session?.user?.id, unitId, bonusXp: 150 });
    }
  };

  const isAllCorrect = quizSubmitted && quizData.every((q, i) => quizAnswers[i] === q.answerIndex);

  if (showConfetti) {
    return <ConfettiExplosion onDone={() => { if (onComplete) onComplete(); else window.location.href = "/dashboard"; }} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20 px-4 sm:px-0">
      {/* ── Story Header ── */}
      <div className="text-center space-y-4">
        <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-gold/20">
          Interactive Story
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter italic">{story.title}</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Tap highlighted words for definitions · Tap sentences for translation
        </p>
      </div>

      {/* ── Story Body ── */}
      <div className="elite-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-border/30 space-y-6 sm:space-y-8 shadow-2xl">
        {content.map((line, idx) => (
          <div key={idx} className="group relative">
            <p
              className="text-lg sm:text-2xl text-foreground/90 font-medium leading-relaxed cursor-pointer hover:text-foreground transition-colors"
              onClick={() => toggleLine(idx)}
            >
              {parseSentence(line.en, words)}
            </p>
            <AnimatePresence>
              {expandedLines.has(idx) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-base sm:text-xl text-primary font-bold bg-primary/5 border border-primary/10 rounded-xl p-4 text-right" dir="rtl">
                    {line.ar}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Comprehension Quiz ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/50" />
          <h3 className="text-sm font-black text-gold/70 uppercase tracking-[0.3em]">Comprehension Quiz</h3>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <div className="space-y-8">
          {quizData.map((q, qIndex) => (
            <div key={qIndex} className="elite-card p-6 rounded-2xl border border-border/30 space-y-4 shadow-lg">
              <h4 className="text-lg font-bold text-foreground flex gap-3">
                <span className="text-gold/50">{qIndex + 1}.</span> {q.question}
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {q.options.map((opt, oIndex) => {
                  const isSelected = quizAnswers[qIndex] === oIndex;
                  const isCorrect = q.answerIndex === oIndex;
                  const showCorrect = quizSubmitted && isCorrect;
                  const showWrong = quizSubmitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleOptionSelect(qIndex, oIndex)}
                      disabled={quizSubmitted}
                      className={cn(
                        "text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200",
                        isSelected && !quizSubmitted ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" : "bg-muted/10 border-border/30",
                        !quizSubmitted && !isSelected ? "hover:bg-muted/30 hover:border-primary/50" : "",
                        showCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10" : "",
                        showWrong ? "bg-rose-500/20 border-rose-500 text-rose-500" : "",
                        quizSubmitted && !showCorrect && !showWrong ? "opacity-40" : ""
                      )}
                    >
                      <span className="font-bold mr-2 opacity-50">{String.fromCharCode(65 + oIndex)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quiz Actions ── */}
        <div className="pt-6 flex flex-col items-center gap-4">
          {!quizSubmitted ? (
            <button
              onClick={submitQuiz}
              disabled={Object.keys(quizAnswers).length < quizData.length}
              className="bg-gold text-gold-foreground px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-gold/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Submit Answers
            </button>
          ) : !isAllCorrect ? (
            <div className="text-center space-y-4">
              <p className="text-rose-500 font-bold bg-rose-500/10 px-6 py-3 rounded-xl border border-rose-500/20">
                Some answers were incorrect. Please review the story and try again.
              </p>
              <button
                onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Retry Quiz
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
