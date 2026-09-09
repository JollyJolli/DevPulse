export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#E7E1D4] p-4 text-[#111111] md:p-8" aria-busy="true">
      <div className="mx-auto max-w-[1500px] border-2 border-black bg-[#F4F1E8]">
        <div className="h-16 animate-pulse border-b-2 border-black bg-white/60" />
        <div className="h-80 animate-pulse border-b-2 border-black bg-[#3567FF]/75" />
        <div className="grid gap-0 md:grid-cols-3">
          <div className="h-52 animate-pulse border-b-2 border-black bg-[#FF5C35] md:border-b-0 md:border-r-2" />
          <div className="h-52 animate-pulse border-b-2 border-black bg-[#FFD84D] md:border-b-0 md:border-r-2" />
          <div className="h-52 animate-pulse bg-[#78E6D0]" />
        </div>
        <p className="sr-only">Loading public GitHub analytics</p>
      </div>
    </main>
  );
}
