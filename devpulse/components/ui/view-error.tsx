"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ViewError({ reset }: { reset: () => void }) {
  const spanish = useSearchParams().get("lang") === "es";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FF6B8A] p-6 text-[#111111]">
      <div className="w-full max-w-2xl border-2 border-black bg-[#F4F1E8] p-8 md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">DevPulse</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          {spanish ? "No se pudo cargar esta vista" : "This view could not be loaded"}
        </h1>
        <p className="mt-4 font-semibold text-black/60">
          {spanish
            ? "GitHub puede estar temporalmente limitado. Inténtalo de nuevo en un momento."
            : "GitHub may be temporarily limited. Try again in a moment."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="border-2 border-black bg-[#D8FF54] px-5 py-3 font-black">
            {spanish ? "Reintentar" : "Try again"}
          </button>
          <Link href={spanish ? "/?lang=es" : "/"} className="border-2 border-black bg-white px-5 py-3 font-black">
            {spanish ? "Inicio" : "Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
