import type { WardrobeItem } from "@/types/item";

const STORAGE_KEY = "smart-wardrobe:ootd-candidates";
const COOKIE_KEY = "smart-wardrobe-ootd-candidate-count";
const EVENT_NAME = "ootd-candidates-changed";
const MOTION_EVENT_NAME = "ootd-candidates-motion";

export type OotdCandidateMotionDetail = {
  sourceX: number;
  sourceY: number;
  mode: "add" | "remove";
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getOotdCandidates() {
  if (!canUseStorage()) {
    return [] as WardrobeItem[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WardrobeItem[]) : [];
  } catch {
    return [];
  }
}

export function saveOotdCandidates(items: WardrobeItem[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.cookie = `${COOKIE_KEY}=${items.length}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
}

export function addOotdCandidate(item: WardrobeItem) {
  const current = getOotdCandidates();
  if (current.some((entry) => entry.id === item.id)) {
    return current;
  }

  const next = [item, ...current];
  saveOotdCandidates(next);
  return next;
}

export function removeOotdCandidate(itemId: string) {
  const next = getOotdCandidates().filter((item) => item.id !== itemId);
  saveOotdCandidates(next);
  return next;
}

export function clearOotdCandidates() {
  saveOotdCandidates([]);
}

export function hasOotdCandidate(itemId: string) {
  return getOotdCandidates().some((item) => item.id === itemId);
}

export function onOotdCandidatesChanged(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function dispatchOotdCandidateMotion(detail: OotdCandidateMotionDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(MOTION_EVENT_NAME, { detail }));
}

export function onOotdCandidateMotion(listener: (detail: OotdCandidateMotionDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<OotdCandidateMotionDetail>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(MOTION_EVENT_NAME, handler);
  return () => window.removeEventListener(MOTION_EVENT_NAME, handler);
}
