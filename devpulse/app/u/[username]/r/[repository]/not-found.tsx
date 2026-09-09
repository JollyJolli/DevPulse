import Link from "next/link";

export default function RepositoryNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFD84D] p-6">
      <div className="max-w-2xl border-2 border-black bg-[#F4F1E8] p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">404 · Project Radar</p>
        <h1 className="mt-3 text-5xl font-black">Public repository not found</h1>
        <p className="mt-4 font-semibold text-black/55">
          The repository may be private, renamed, deleted, or outside the requested owner profile.
        </p>
        <Link href="/" className="mt-8 inline-flex border-2 border-black bg-[#FF5C35] px-5 py-3 font-black">
          DevPulse home
        </Link>
      </div>
    </main>
  );
}
