import React from "react";
// Assumes Leaderboard is a default export from a social/Leaderboard component or similar.
import Leaderboard from "@/components/Leaderboard";

export const metadata = {
  title: "Compete | The Elite English Mentor",
  description: "Global and friends leaderboards",
};

export default function CompetePage() {
  return (
    <div className="container max-w-lg mx-auto p-4 pb-24 min-h-screen">
      <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </a>
      <h1 className="text-2xl font-bold mb-6 text-center text-primary" dir="rtl">
        المنافسة (Compete)
      </h1>
      {/* The existing dual-tab Leaderboard component should render here */}
      <Leaderboard />
    </div>
  );
}
