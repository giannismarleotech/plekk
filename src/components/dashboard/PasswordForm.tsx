"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/app/[slug]/actions";

export function PasswordForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const form = e.currentTarget; start(async () => { const r = await changePassword(fd); setMsg(r.ok ? "Wachtwoord gewijzigd." : r.error ?? "Mislukt"); if (r.ok) form.reset(); }); }} className="grid gap-3 sm:grid-cols-3 items-end">
      <label className="block"><span className="label">Huidig</span><input name="current" type="password" required className="input" autoComplete="current-password" /></label>
      <label className="block"><span className="label">Nieuw (min. 8)</span><input name="next" type="password" required minLength={8} className="input" autoComplete="new-password" /></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-brand text-white">Wijzig</button>{msg && <span className="text-muted">{msg}</span>}</div>
    </form>
  );
}
