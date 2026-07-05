"use client";

import { useCallback, useEffect, useState } from "react";

const PRESETS = [60, 90, 120, 180];

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available — ignore */
  }
}

function notify() {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Rest over", { body: "Time for your next set." });
    }
  } catch {
    /* notifications not available — ignore */
  }
}

export function RestTimer() {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [duration, setDuration] = useState(90);

  const start = useCallback((secs: number) => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    setDuration(secs);
    setRemaining(secs);
    setEndAt(Date.now() + secs * 1000);
  }, []);

  // Tick down to zero, then alert.
  useEffect(() => {
    if (endAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        beep();
        notify();
        setEndAt(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endAt]);

  // Auto-start a rest period whenever a set is logged elsewhere on the page.
  useEffect(() => {
    const handler = () => start(duration);
    window.addEventListener("replog:set-logged", handler);
    return () => window.removeEventListener("replog:set-logged", handler);
  }, [start, duration]);

  const running = endAt != null;
  const progress = running && duration > 0 ? 1 - remaining / duration : 0;
  const closing = running && remaining <= 10;

  return (
    <div className="flex flex-col gap-3">
      {running ? (
        <>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-mono text-4xl font-semibold tabular-nums ${
                closing ? "text-[var(--color-red)]" : ""
              }`}
            >
              {mmss(remaining)}
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              resting · {duration}s
            </span>
          </div>
          <div className="h-1 w-full bg-[var(--color-rule-soft)]">
            <div
              className={`h-full transition-[width] duration-300 ${
                closing ? "bg-[var(--color-red)]" : "bg-[var(--color-green)]"
              }`}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEndAt((e) => (e ?? Date.now()) + 30_000)}
              className="btn btn-ghost flex-1 px-3 py-1.5 text-xs"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => setEndAt(null)}
              className="btn btn-ghost flex-1 px-3 py-1.5 text-xs"
            >
              Stop
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            Starts automatically after you log a set — or start one yourself.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => start(s)}
                className={`rounded-[3px] px-2 py-1.5 font-mono text-xs transition-colors ${
                  s === duration
                    ? "bg-[var(--color-ink)] text-[var(--color-sheet)]"
                    : "border border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
