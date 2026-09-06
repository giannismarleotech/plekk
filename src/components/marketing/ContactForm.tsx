"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";

/** Contactformulier: stuurt naar /api/contact (mail via Resend als die geconfigureerd is, anders logging). */
export function ContactForm({ d }: { d: Dictionary }) {
  const c = d.contact;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setState(res.ok ? "sent" : "error");
  }
  if (state === "sent") return <div className="card p-8 text-center"><p className="text-2xl font-bold">✓</p><p className="mt-2 font-semibold">{c.formNote}</p></div>;
  return (
    <form onSubmit={submit} className="card p-6 grid gap-3 sm:grid-cols-2">
      <label className="block"><span className="label">{c.formName}</span><input name="name" required className="input" autoComplete="name" /></label>
      <label className="block"><span className="label">{c.formEmail}</span><input name="email" type="email" required className="input" autoComplete="email" /></label>
      <label className="block"><span className="label">{c.formBusiness}</span><input name="business" className="input" autoComplete="organization" /></label>
      <label className="block"><span className="label">{c.formType}</span><select name="type" className="input">{c.types.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="block sm:col-span-2"><span className="label">{c.formMessage}</span><textarea name="message" rows={4} className="input" /></label>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="sm:col-span-2 flex items-center gap-4">
        <button disabled={state === "sending"} className="btn font-bold text-ink" style={{ background: "var(--green)" }}>{c.formSend}</button>
        <span className="text-sm text-muted">{state === "error" ? "✕" : c.formNote}</span>
      </div>
    </form>
  );
}
