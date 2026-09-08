"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Activity,
  GitBranch,
  Code2,
  BarChart3,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = username
      .trim()
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/^github\.com\//, "")
      .replace(/\/$/, "");

    if (!cleanUsername) return;

    router.push(`/u/${cleanUsername}`);
  }

  return (
    <main className="min-h-screen bg-[#F4F1E8] text-[#111111]">
      {/* NAV */}
      <nav className="flex items-center justify-between border-b-2 border-black px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-[#FF5C35] text-white">
            <Activity size={20} strokeWidth={2.5} />
          </div>

          <span className="text-xl font-black tracking-tight">
            DevPulse
          </span>
        </div>

        <a
          href="https://github.com/jollyjolli"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-60"
        >
          <GitBranch size={18} />
          GitHub
        </a>
      </nav>

      {/* HERO */}
      <section className="grid min-h-[670px] border-b-2 border-black lg:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT */}
        <div className="flex flex-col justify-between border-black p-6 md:p-10 lg:border-r-2 lg:p-14">
          <div>
            <div className="mb-10 inline-flex items-center gap-2 border-2 border-black bg-[#D8FF54] px-3 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <span className="h-2 w-2 bg-black" />
              Public GitHub Analytics
            </div>

            <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl md:text-8xl xl:text-[104px]">
              SEE HOW
              <br />
              DEVELOPERS
              <br />
              <span className="text-[#3567FF]">ACTUALLY</span>
              <br />
              BUILD.
            </h1>
          </div>

          <div className="mt-14 max-w-xl">
            <p className="mb-6 text-lg font-medium leading-relaxed text-black/65 md:text-xl">
              DevPulse turns public GitHub activity into clear insights about
              projects, focus, languages and development patterns.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col border-2 border-black bg-white sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 px-4">
                <GitBranch className="shrink-0" size={20} />

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="jollyjolli"
                  aria-label="GitHub username"
                  className="h-16 w-full bg-transparent text-base font-semibold outline-none placeholder:text-black/30"
                />
              </div>

              <button
                type="submit"
                className="flex h-16 items-center justify-center gap-2 border-t-2 border-black bg-[#FF5C35] px-7 font-black transition-transform hover:-translate-y-1 sm:border-l-2 sm:border-t-0"
              >
                Analyze
                <ArrowRight size={19} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — COLORFUL DATA PREVIEW */}
        <div className="grid grid-cols-2 grid-rows-3">
          <div className="flex flex-col justify-between border-b-2 border-r-2 border-black bg-[#FFD84D] p-6">
            <GitBranch size={24} />

            <div>
              <p className="text-5xl font-black tracking-tight">04</p>
              <p className="mt-1 text-sm font-bold uppercase">
                Active Projects
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between border-b-2 border-black bg-[#FF6B8A] p-6">
            <Activity size={24} />

            <div>
              <p className="text-5xl font-black tracking-tight">81</p>
              <p className="mt-1 text-sm font-bold uppercase">Focus Score</p>
            </div>
          </div>

          <div className="col-span-2 flex flex-col justify-between border-b-2 border-black bg-[#3567FF] p-6 text-white md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Contribution Activity
                </p>

                <p className="mt-2 text-4xl font-black">167</p>
              </div>

              <BarChart3 size={26} />
            </div>

            <div className="mt-8 flex h-20 items-end gap-2">
              {[24, 38, 28, 55, 44, 72, 60, 86, 48, 64, 92, 76, 100, 70].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-white"
                    style={{ height: `${height}%` }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between border-r-2 border-black bg-[#78E6D0] p-6">
            <Code2 size={24} />

            <div>
              <p className="text-xl font-black">TypeScript</p>
              <p className="mt-1 text-sm font-semibold text-black/60">
                Most active language
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-[#D8FF54] p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em]">
              Current streak
            </div>

            <div>
              <span className="text-6xl font-black tracking-tight">6</span>
              <span className="ml-2 font-bold">days</span>
            </div>
          </div>
        </div>
      </section>

      {/* SMALL INFO STRIP */}
      <section className="grid border-b-2 border-black md:grid-cols-3">
        <div className="border-black p-6 md:border-r-2">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.15em] text-black/40">
            01
          </span>

          <p className="font-bold">
            Enter any public GitHub username.
          </p>
        </div>

        <div className="border-t-2 border-black p-6 md:border-r-2 md:border-t-0">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.15em] text-black/40">
            02
          </span>

          <p className="font-bold">
            DevPulse analyzes public development activity.
          </p>
        </div>

        <div className="border-t-2 border-black p-6 md:border-t-0">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.15em] text-black/40">
            03
          </span>

          <p className="font-bold">
            Get a shareable developer analytics page.
          </p>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-4 px-6 py-8 text-sm font-semibold md:flex-row md:px-10">
        <span>DevPulse © 2026</span>
        <span className="text-black/50">devpulse.formen.cc</span>
      </footer>
    </main>
  );
}