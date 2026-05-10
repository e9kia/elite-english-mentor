"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StartLearningButton({ unitId }: { unitId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = () => {
    setIsLoading(true);
    router.push(`/learn/${unitId}`);
  };

  return (
    <button
      onClick={handleStart}
      disabled={isLoading}
      className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:transform-none"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Searching Unit...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          Start Learning
        </>
      )}
    </button>
  );
}
