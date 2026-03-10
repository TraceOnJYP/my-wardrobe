"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LAST_OPENED_ON_KEY = "smart-wardrobe:ootd-last-opened-on";
const LAST_SELECTED_DAY_KEY = "smart-wardrobe:ootd-last-selected-day";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function OotdDaySelectionSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const todayKey = toDateKey(now);
    const currentDay = searchParams.get("day");

    const lastOpenedOn = window.localStorage.getItem(LAST_OPENED_ON_KEY);
    const lastSelectedDay = window.localStorage.getItem(LAST_SELECTED_DAY_KEY);

    if (lastOpenedOn && lastOpenedOn !== todayKey) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("day", todayKey);
      window.localStorage.setItem(LAST_OPENED_ON_KEY, todayKey);
      window.localStorage.setItem(LAST_SELECTED_DAY_KEY, todayKey);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      return;
    }

    if (currentDay) {
      window.localStorage.setItem(LAST_OPENED_ON_KEY, todayKey);
      window.localStorage.setItem(LAST_SELECTED_DAY_KEY, currentDay);
      return;
    }

    const nextDay = lastOpenedOn === todayKey && lastSelectedDay ? lastSelectedDay : todayKey;
    const next = new URLSearchParams(searchParams.toString());
    next.set("day", nextDay);

    window.localStorage.setItem(LAST_OPENED_ON_KEY, todayKey);
    window.localStorage.setItem(LAST_SELECTED_DAY_KEY, nextDay);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [now, pathname, router, searchParams]);

  return null;
}
