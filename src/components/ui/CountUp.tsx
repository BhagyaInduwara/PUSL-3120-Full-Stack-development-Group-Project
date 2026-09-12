"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  className?: string;
}

export function CountUp({ to, duration = 600, className = "" }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(to);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = 0;
    const endVal = to;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [to, duration]);

  return <span className={className}>{displayValue}</span>;
}
