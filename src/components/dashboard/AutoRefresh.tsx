"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Polling als eenvoudig alternatief voor realtime; vervang later door Supabase Realtime. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
