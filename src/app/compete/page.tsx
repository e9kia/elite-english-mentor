import React from "react";
// Assumes Leaderboard is a default export from a social/Leaderboard component or similar.
import Leaderboard from "@/components/Leaderboard";

export const metadata = {
  title: "Compete | The Elite English Mentor",
  description: "Global and friends leaderboards",
};

export default function CompetePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2" dir="rtl">
            المنافسة <span className="text-primary opacity-80">(Compete)</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground" dir="rtl">
            تحدَّ أصدقاءك واختبر مستواك
          </p>
        </div>
        <a href="/dashboard" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-muted border border-border/50 text-sm font-semibold text-foreground rounded-full shadow-sm transition-all self-start md:self-auto">
          <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Hub
        </a>
      </div>
      
      <div className="glass rounded-[2rem] p-2 shadow-2xl border border-border/50 bg-card/40">
        <Leaderboard />
      </div>
    </div>
  );
}
