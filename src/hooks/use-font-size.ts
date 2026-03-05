"use client";

import { useCallback, useSyncExternalStore } from "react";

export type FontSize = "small" | "medium" | "large" | "xlarge";

const SIZES: FontSize[] = ["small", "medium", "large", "xlarge"];
const SIZE_LABELS: Record<FontSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
  xlarge: "XL",
};

const STORAGE_KEY = "thehaven-news-font";
let fontSize: FontSize = "medium";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SIZES.includes(saved as FontSize)) fontSize = saved as FontSize;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFontSize() {
  const current = useSyncExternalStore(
    subscribe,
    () => fontSize,
    () => "medium" as FontSize
  );

  const cycleFontSize = useCallback(() => {
    const idx = SIZES.indexOf(fontSize);
    fontSize = SIZES[(idx + 1) % SIZES.length];
    try {
      localStorage.setItem(STORAGE_KEY, fontSize);
    } catch {}
    emit();
  }, []);

  return { fontSize: current, label: SIZE_LABELS[current], cycleFontSize };
}
