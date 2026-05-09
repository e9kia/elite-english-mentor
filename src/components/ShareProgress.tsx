"use client";
// src/components/ShareProgress.tsx
// Share Progress button — Web Share API with clipboard fallback

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn }    from "@/lib/utils";

interface ShareProgressProps {
  username:    string;
  xp:          number;
  mastered:    number;
  streak:      number;
  wordsTotal?: number;
}

export default function ShareProgress({ username, xp, mastered, streak, wordsTotal = 4000 }: ShareProgressProps) {
  const [copied, setCopied] = useState(false);

  const buildText = useCallback(() => {
    const pct = Math.round((mastered / wordsTotal) * 100);
    const bars = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    return [
      `📚 My English Vocabulary Progress`,
      ``,
      `👤 ${username}`,
      `⚡ ${xp.toLocaleString()} XP earned`,
      `🎓 ${mastered} / ${wordsTotal} words mastered`,
      `${bars} ${pct}%`,
      streak > 0 ? `🔥 ${streak}-day study streak` : null,
      ``,
      `Learning with 4,000 Essential Words Platform`,
      `https://localhost:3001/profile/${username}`,
    ].filter(Boolean).join("\n");
  }, [username, xp, mastered, streak, wordsTotal]);

  const handleShare = useCallback(async () => {
    const text = buildText();

    // Try native share first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "My English Learning Progress", text });
        return;
      } catch { /* user cancelled or not supported */ }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Progress copied to clipboard! 📋\nPaste it in WhatsApp or anywhere you like.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [buildText]);

  return (
    <button
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg active:scale-95",
        copied
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      aria-label="Share your progress"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Progress
        </>
      )}
    </button>
  );
}
