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
      <h1 className="text-2xl font-bold mb-6 text-center text-primary" dir="rtl">
        المنافسة (Compete)
      </h1>
      {/* The existing dual-tab Leaderboard component should render here */}
      <Leaderboard />
    </div>
  );
}
