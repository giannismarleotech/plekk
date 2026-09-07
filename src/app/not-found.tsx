import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="flex justify-center"><Logo size={26} /></div>
        <h1 className="text-2xl font-bold">Deze pagina bestaat niet</h1>
        <p className="text-muted">De link klopt niet meer, of de zaak die je zoekt is niet (meer) actief op Plekk.</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/" className="btn-brand text-white">Naar plekk.be</Link>
          <Link href="/login" className="btn border border-line bg-surface">Inloggen</Link>
        </div>
      </div>
    </main>
  );
}
