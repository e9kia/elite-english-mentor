"use client";
// =====================================================================
//  src/app/(admin)/admin/stories/page.tsx
//  Interactive Story & Quiz Architect
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertStory } from "@/app/actions/admin";

export default function StoryArchitectPage() {
  const [levelId, setLevelId] = useState(1);
  const [unitNumber, setUnitNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [sentences, setSentences] = useState([{ en: "", ar: "" }]);
  const [quizData, setQuizData] = useState([
    { question: "", options: ["", "", "", ""], answerIndex: 0 },
    { question: "", options: ["", "", "", ""], answerIndex: 0 },
    { question: "", options: ["", "", "", ""], answerIndex: 0 },
  ]);
  const [isPending, start] = useTransition();

  const addSentence = () => setSentences([...sentences, { en: "", ar: "" }]);
  const removeSentence = (index: number) => setSentences(sentences.filter((_, i) => i !== index));

  const updateSentence = (index: number, field: "en" | "ar", value: string) => {
    const newSentences = [...sentences];
    newSentences[index][field] = value;
    setSentences(newSentences);
  };

  const updateQuiz = (qIndex: number, field: string, value: any) => {
    const newQuiz = [...quizData];
    if (field === "question") newQuiz[qIndex].question = value;
    else if (field === "answerIndex") newQuiz[qIndex].answerIndex = value;
    else {
      // Option update
      newQuiz[qIndex].options[parseInt(field)] = value;
    }
    setQuizData(newQuiz);
  };

  const handleSave = () => {
    if (!title.trim()) return toast.error("Story title is required.");
    if (sentences.some(s => !s.en.trim() || !s.ar.trim())) return toast.error("All sentences must have English and Arabic text.");
    if (quizData.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) return toast.error("All quiz questions and options must be filled.");

    start(async () => {
      try {
        await upsertStory({ levelId, unitNumber, title, content: sentences, quizData });
        toast.success(`Story successfully saved for Level ${levelId} Unit ${unitNumber}! 🎉`);
        // Optional: clear form or keep it to edit
      } catch (err: any) {
        toast.error(err.message || "Failed to save story.");
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black gradient-text tracking-tighter">Story & Quiz Architect</h1>
        <p className="text-muted-foreground mt-1 font-medium">Build interactive stories and comprehension quizzes injected directly into the student curriculum.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Metadata & Actions */}
        <div className="space-y-6">
          <div className="elite-card p-6 rounded-3xl border border-gold/20 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest border-b border-border/50 pb-2">Target Routing</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Level (1-6)</label>
              <select value={levelId} onChange={e => setLevelId(parseInt(e.target.value))} className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors">
                {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unit (1-30)</label>
              <select value={unitNumber} onChange={e => setUnitNumber(parseInt(e.target.value))} className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors">
                {Array.from({length: 30}, (_, i) => i + 1).map(u => <option key={u} value={u}>Unit {u}</option>)}
              </select>
            </div>

            <div className="pt-4">
              <button onClick={handleSave} disabled={isPending} className="w-full bg-gold text-gold-foreground py-4 rounded-xl font-black shadow-lg shadow-gold/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                {isPending ? "Injecting..." : "Publish to Database 🚀"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Content Builder */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TITLE */}
          <div className="elite-card p-6 rounded-3xl border border-border/50 shadow-xl space-y-4">
             <label className="text-xs font-black text-gold uppercase tracking-widest">Story Title</label>
             <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Midnight Heist" className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-2xl font-black text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors" />
          </div>

          {/* SENTENCES */}
          <div className="elite-card p-6 rounded-3xl border border-border/50 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-lg font-black text-foreground uppercase tracking-widest">Sentence Array</h2>
              <button onClick={addSentence} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">+ Add Line</button>
            </div>

            <div className="space-y-4">
              {sentences.map((s, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-2">{i+1}</div>
                  <div className="flex-1 space-y-2">
                    <textarea value={s.en} onChange={e => updateSentence(i, "en", e.target.value)} placeholder="English sentence..." className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors min-h-[60px]" />
                    <textarea value={s.ar} onChange={e => updateSentence(i, "ar", e.target.value)} placeholder="الترجمة العربية..." dir="rtl" className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-primary/50 transition-colors min-h-[60px]" />
                  </div>
                  <button onClick={() => removeSentence(i)} className="text-rose-500/30 hover:text-rose-500 mt-4 px-2 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* QUIZ */}
          <div className="elite-card p-6 rounded-3xl border border-border/50 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest border-b border-border/50 pb-2">Comprehension Quiz</h2>
            
            <div className="space-y-8">
              {quizData.map((q, i) => (
                <div key={i} className="bg-muted/10 p-5 rounded-2xl border border-border/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-black">Q{i+1}.</span>
                    <input value={q.question} onChange={e => updateQuiz(i, "question", e.target.value)} placeholder="Enter question..." className="flex-1 bg-transparent border-b border-border/50 focus:border-primary px-2 py-1 text-sm font-bold text-foreground focus:outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input type="radio" name={`q${i}`} checked={q.answerIndex === optIdx} onChange={() => updateQuiz(i, "answerIndex", optIdx)} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                        <input value={opt} onChange={e => updateQuiz(i, optIdx.toString(), e.target.value)} placeholder={`Option ${String.fromCharCode(65+optIdx)}`} className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
