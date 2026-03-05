"use client";

import { useCallback, useSyncExternalStore } from "react";

interface FeedPrefs {
  order: string[];
  hidden: Set<string>;
}

const STORAGE_KEY = "thehaven-feed-prefs";

let prefs: FeedPrefs = { order: [], hidden: new Set() };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function loadFromStorage(): FeedPrefs {
  if (typeof window === "undefined") return { order: [], hidden: new Set() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [], hidden: new Set() };
    const parsed = JSON.parse(raw);
    return {
      order: parsed.order || [],
      hidden: new Set(parsed.hidden || []),
    };
  } catch {
    return { order: [], hidden: new Set() };
  }
}

function saveToStorage(p: FeedPrefs) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: p.order, hidden: [...p.hidden] })
    );
  } catch {
    // storage full
  }
}

// Initialize on first import (client only)
if (typeof window !== "undefined") {
  prefs = loadFromStorage();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): FeedPrefs {
  return prefs;
}

function getServerSnapshot(): FeedPrefs {
  return { order: [], hidden: new Set() };
}

export function useFeedPrefs() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const toggleSource = useCallback((source: string) => {
    const next = {
      order: [...prefs.order],
      hidden: new Set(prefs.hidden),
    };
    if (next.hidden.has(source)) {
      next.hidden.delete(source);
    } else {
      next.hidden.add(source);
    }
    prefs = next;
    saveToStorage(prefs);
    emit();
  }, []);

  const syncSources = useCallback((sources: string[]) => {
    const known = new Set(prefs.order);
    const newSources = sources.filter((s) => !known.has(s));
    if (newSources.length === 0) return;
    prefs = {
      order: [...prefs.order, ...newSources],
      hidden: new Set(prefs.hidden),
    };
    saveToStorage(prefs);
    emit();
  }, []);

  return { prefs: current, toggleSource, syncSources };
}
