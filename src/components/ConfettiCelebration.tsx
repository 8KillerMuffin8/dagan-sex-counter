"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  onDone?: () => void;
}

export default function ConfettiCelebration({ onDone }: ConfettiCelebrationProps) {
  useEffect(() => {
    // Blast 1: Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Blast 2: Left cannon
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
    }, 250);

    // Blast 3: Right cannon
    const timer2 = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 450);

    const finishTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(finishTimer);
    };
  }, [onDone]);

  return null;
}
