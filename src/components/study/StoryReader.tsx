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
  id: string; word: string; type: string; definition: string; example: string;
  meaningArabic: string; typeArabic: string; sentenceArabic: string;
  sentence2: string | null; sentence3: string | null; sentence4: string | null;
  sentence2Arabic: string | null; sentence3Arabic: string | null; sentence4Arabic: string | null;
  ipa: string | null; collocations: string | null; antonyms: string | null; synonyms: string | null;
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
  const [showModal, setShowModal] = useState(false);
  const additionalSentences = [
    { en: wordInfo.sentence2, ar: wordInfo.sentence2Arabic },
    { en: wordInfo.sentence3, ar: wordInfo.sentence3Arabic },
    { en: wordInfo.sentence4, ar: wordInfo.sentence4Arabic }
  ].filter(s => s.en);

  return (
    <span className="relative inline-block cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
      <span className="text-gold font-bold underline decoration-gold/40 decoration-wavy underline-offset-4 transition-colors group-hover:text-gold-light">
        {text}
      </span>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md cursor-default" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="elite-card relative w-full max-w-lg bg-neutral-900/95 border border-gold/20 shadow-2xl rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Close Button */}
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors z-10">✕</button>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="space-y-6">
                  {/* Word + Type */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pr-8">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl sm:text-4xl font-black text-foreground">{wordInfo.word}</h3>
                      <VoiceButton word={wordInfo.word} size="sm" />
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest border bg-gold/10 text-gold border-gold/30">
                        {wordInfo.type}
                      </span>
                    </div>
                    {wordInfo.typeArabic && <span className="text-sm font-black border border-gold/20 rounded-lg px-2 py-1 bg-gold/5 text-gold" dir="rtl">{wordInfo.typeArabic}</span>}
                  </div>

                  {/* Arabic Translation */}
                  <div className="space-y-1 pb-4 border-b border-white/10">
                    <p className="text-[9px] font-black text-gold/50 uppercase tracking-[0.4em]">الترجمة</p>
                    <p className="text-2xl sm:text-3xl text-foreground leading-[1.8] font-bold text-right" dir="rtl">{wordInfo.meaningArabic}</p>
                  </div>

                  {/* Definition */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary/50 uppercase tracking-[0.4em]">Definition</p>
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{wordInfo.definition}</p>
                  </div>

                  {/* Primary Sentence */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-blue-400/50 uppercase tracking-[0.4em]">Example</p>
                    <blockquote className="border-l-2 border-primary/30 pl-3 text-sm sm:text-base text-muted-foreground italic leading-relaxed">
                      &ldquo;{wordInfo.example}&rdquo;
                    </blockquote>
                    {wordInfo.sentenceArabic && (
                      <p className="text-xs sm:text-sm text-muted-foreground/60 text-right pr-3 pt-1" dir="rtl">{wordInfo.sentenceArabic}</p>
                    )}
                  </div>

                  {/* Extra Sentences */}
                  {additionalSentences.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[9px] font-black text-gold/70 uppercase tracking-[0.3em]">جمل إضافية</p>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                      {additionalSentences.map((s, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed mb-1.5">{s.en}</p>
                          {s.ar && <p className="text-[11px] sm:text-xs text-muted-foreground/80 text-right" dir="rtl">{s.ar}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  {(wordInfo.collocations || wordInfo.synonyms || wordInfo.antonyms) && (
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                      {wordInfo.collocations && (
                        <div className="text-[10px] text-muted-foreground bg-white/5 rounded-lg p-2.5 border border-white/5">
                          <span className="font-black text-gold/50 block mb-0.5 uppercase tracking-wider">Collocations</span>
                          {wordInfo.collocations}
                        </div>
                      )}
                      {wordInfo.synonyms && (
                        <div className="text-[10px] text-muted-foreground bg-white/5 rounded-lg p-2.5 border border-white/5">
                          <span className="font-black text-blue-400/50 block mb-0.5 uppercase tracking-wider">Synonyms</span>
                          {wordInfo.synonyms}
                        </div>
                      )}
                      {wordInfo.antonyms && (
                        <div className="text-[10px] text-muted-foreground bg-white/5 rounded-lg p-2.5 border border-white/5">
                          <span className="font-black text-rose-400/50 block mb-0.5 uppercase tracking-wider">Antonyms</span>
                          {wordInfo.antonyms}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
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
