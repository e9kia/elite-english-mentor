"use client";
// src/components/study/ConfettiEffect.tsx
// Fires canvas-confetti burst. Call triggerConfetti() from parent.

import { useCallback, forwardRef, useImperativeHandle } from "react";
import confetti from "canvas-confetti";

export interface ConfettiHandle {
  fire: () => void;
}

const ConfettiEffect = forwardRef<ConfettiHandle>((_, ref) => {
  const fire = useCallback(() => {
    // Main burst from both sides
    const duration = 2200;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#818cf8", "#a78bfa", "#34d399", "#fbbf24"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#818cf8", "#a78bfa", "#34d399", "#fbbf24"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Center pop
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.55 },
        colors: ["#6366f1", "#818cf8", "#fbbf24", "#34d399", "#f472b6"],
        scalar: 1.1,
      });
    }, 300);
  }, []);

  useImperativeHandle(ref, () => ({ fire }));
  return null; // renders nothing — purely imperative
});

ConfettiEffect.displayName = "ConfettiEffect";
export default ConfettiEffect;
