import { useState, useEffect, useRef } from 'react';

/**
 * Countdown timer hook that calculates remaining seconds from a
 * server-provided `startedAt` timestamp, keeping all tabs in sync.
 *
 * @param startedAt  Unix‐ms when the question started (or null/undefined)
 * @param duration   Total duration in seconds
 * @returns          Remaining seconds (null if no active timer)
 */
export function usePollTimer(
  startedAt: number | undefined | null,
  duration: number | undefined | null,
): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt == null || duration == null) {
      setRemaining(null);
      return;
    }

    const calc = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, Math.ceil(duration - elapsed));
      setRemaining(left);
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    calc();
    intervalRef.current = setInterval(calc, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt, duration]);

  return remaining;
}

/**
 * Formats seconds into MM:SS display string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
