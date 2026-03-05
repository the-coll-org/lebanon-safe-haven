"use client";

import { useCallback, useSyncExternalStore } from "react";

type Layout = "grid" | "list";

const STORAGE_KEY = "thehaven-news-layout";
let layout: Layout = "grid";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "grid" || saved === "list") layout = saved;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useNewsLayout() {
  const current = useSyncExternalStore(
    subscribe,
    () => layout,
    () => "grid" as Layout
  );

  const toggleLayout = useCallback(() => {
    layout = layout === "grid" ? "list" : "grid";
    try {
      localStorage.setItem(STORAGE_KEY, layout);
    } catch {}
    emit();
  }, []);

  return { layout: current, toggleLayout };
}
