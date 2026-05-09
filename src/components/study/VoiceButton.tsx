"use client";
// src/components/study/VoiceButton.tsx
// Web Speech API — zero dependencies, works in all modern browsers.

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  word: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function VoiceButton({ word, className, size = "md" }: VoiceButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const speak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // don't flip the card
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setUnsupported(true);
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang  = "en-US";
    utterance.rate  = 0.85;   // slightly slower for clarity
    utterance.pitch = 1;

    // Prefer a native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === "en-US" && v.localService
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [word]);

  if (unsupported) return null;

  const sizeMap = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };
  const iconMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

  return (
    <button
      onClick={speak}
      disabled={speaking}
      title={`Pronounce "${word}"`}
      aria-label={`Pronounce ${word}`}
      className={cn(
        "flex items-center justify-center rounded-full border transition-all duration-200",
        "bg-muted/60 border-border/50 text-muted-foreground",
        "hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:scale-110",
        speaking && "bg-primary/20 border-primary/50 text-primary animate-pulse-slow",
        "disabled:cursor-not-allowed",
        sizeMap[size],
        className
      )}
    >
      {speaking ? (
        // Animated sound-wave icon
        <svg className={iconMap[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M8.464 8.464a5 5 0 000 7.072" />
        </svg>
      ) : (
        // Speaker icon
        <svg className={iconMap[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9 9l3-3v12l-3-3H6a1 1 0 01-1-1v-4a1 1 0 011-1h3z" />
        </svg>
      )}
    </button>
  );
}
