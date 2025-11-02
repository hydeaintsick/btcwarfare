"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CountdownProps {
  startTime: number | bigint; // timestamp in seconds
  duration: number; // in seconds
  onComplete?: () => void;
}

export function Countdown({ startTime, duration, onComplete }: CountdownProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const startTimestamp = Number(startTime);
      const endTimestamp = startTimestamp + duration;
      const now = Math.floor(Date.now() / 1000);
      const remainingSeconds = Math.max(0, endTimestamp - now);

      setRemaining(remainingSeconds);

      if (remainingSeconds === 0 && !isComplete) {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, onComplete, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (remaining / duration) * 100 : 0;

  return (
    <div className="text-center">
      <motion.div
        key={remaining}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-6xl font-bold neon-text neon-cyan mb-4"
      >
        {formatTime(remaining)}
      </motion.div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <motion.div
          className="bg-neon-cyan h-2 rounded-full glow-cyan"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>
      {isComplete && (
        <p className="text-xl text-neon-pink font-bold animate-pulse-neon">
          Battle finished!
        </p>
      )}
    </div>
  );
}

