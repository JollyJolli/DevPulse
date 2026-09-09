import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFD84D] p-6 text-[#111111]">
      <div className="w-full max-w-2xl border-2 border-black bg-[#F4F1E8] p-8 md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">404 · DevPulse</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">Public profile not found</h1>
        <p className="mt-4 font-semibold text-black/60">
          Check the GitHub username and try again. · Revisa el nombre de usuario de GitHub e inténtalo de nuevo.
        </p>
        <Link href="/" className="mt-8 inline-flex border-2 border-black bg-[#FF5C35] px-5 py-3 font-black">
          Analyze another profile
        </Link>
      </div>
    </main>
  );
}
