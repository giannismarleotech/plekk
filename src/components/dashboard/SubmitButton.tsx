"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/** Opslaan-knop met feedback: toont "Bezig…" tijdens het opslaan en daarna kort "Opgeslagen ✓". */
export function SubmitButton({ children, className = "btn-brand text-white", savedLabel = "Opgeslagen ✓" }: { children: React.ReactNode; className?: string; savedLabel?: string }) {
  const { pending } = useFormStatus();
  const was = useRef(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (was.current && !pending) { setSaved(true); const t = setTimeout(() => setSaved(false), 2500); return () => clearTimeout(t); }
    was.current = pending;
  }, [pending]);
  return (
    <span className="inline-flex items-center gap-3">
      <button disabled={pending} className={`${className} ${pending ? "opacity-70" : ""}`}>{pending ? "Bezig…" : children}</button>
      {saved && <span className="text-sm font-semibold" style={{ color: "#0F7A38" }}>{savedLabel}</span>}
    </span>
  );
}
