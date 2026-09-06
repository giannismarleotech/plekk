"use client";

import { useState, useTransition } from "react";
import { resetOwnerPassword } from "./actions";

export function ResetPasswordButton({ orgId }: { orgId: string }) {
  const [res, setRes] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => { const r = await resetOwnerPassword(orgId); setRes(r.ok ? `${r.email} → ${r.password}` : r.error); })} className="underline text-muted">Nieuw wachtwoord</button>
      {res && <code className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded border border-line">{res}</code>}
    </span>
  );
}
