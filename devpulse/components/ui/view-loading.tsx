export function ViewLoading({ label = "Loading DevPulse" }: { label?: string }) {
  return (
    <main className="min-h-screen bg-[#E7E1D4] p-4 text-[#111111] md:p-8" aria-busy="true">
      <div className="mx-auto max-w-[1400px] border-2 border-black bg-[#F4F1E8]">
        <div className="h-16 animate-pulse border-b-2 border-black bg-white/60" />
        <div className="grid md:grid-cols-2">
          <div className="h-72 animate-pulse border-b-2 border-black bg-[#3567FF]/75 md:border-b-0 md:border-r-2" />
          <div className="h-72 animate-pulse bg-[#FFD84D]" />
        </div>
        <div className="h-56 animate-pulse border-t-2 border-black bg-[#78E6D0]" />
        <p className="sr-only">{label}</p>
      </div>
    </main>
  );
}
