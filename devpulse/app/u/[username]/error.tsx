"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const searchParams = useSearchParams();
  const spanish = searchParams.get("lang") === "es";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FF6B8A] p-6 text-[#111111]">
      <div className="w-full max-w-2xl border-2 border-black bg-[#F4F1E8] p-8 md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">DevPulse</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          {spanish ? "No se pudo cargar este perfil" : "This profile could not be loaded"}
        </h1>
        <p className="mt-4 max-w-xl font-semibold text-black/60">
          {spanish
            ? "GitHub puede estar temporalmente limitado. Inténtalo de nuevo o analiza otro perfil."
            : "GitHub may be temporarily limited. Try again or analyze another profile."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="border-2 border-black bg-[#D8FF54] px-5 py-3 font-black">
            {spanish ? "Reintentar" : "Try again"}
          </button>
          <Link href={spanish ? "/?lang=es" : "/"} className="border-2 border-black bg-white px-5 py-3 font-black">
            {spanish ? "Volver al inicio" : "Back home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
