"use client";

import Link from "next/link";

/** Nette foutpagina i.p.v. een wit scherm. De fout zelf staat in de serverlogs. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="card p-8 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Er ging iets mis</h1>
        <p className="text-muted">Probeer het opnieuw. Blijft het fout gaan, mail dan naar hallo@plekk.be{error.digest ? ` en vermeld code ${error.digest}` : ""}.</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <button onClick={reset} className="btn-brand text-white">Opnieuw proberen</button>
          <Link href="/" className="btn border border-line bg-surface">Naar de startpagina</Link>
        </div>
      </div>
    </main>
  );
}
