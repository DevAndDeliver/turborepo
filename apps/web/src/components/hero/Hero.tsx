import { TerminalWindow } from "./TerminalWindow";
import { GITHUB_URL } from "@/lib/site";

interface HeroProps {
  headline?: string;
  subline?: string;
}

export function Hero({
  headline = "We build things\nthat work.",
  subline = "Full-stack products built on TypeScript, NestJS, and Next.js. Open source tooling, production-grade architecture.",
}: HeroProps) {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-28 pb-24">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
        {/* Left — copy */}
        <div>
          <div
            data-animate=""
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full ring-1 ring-white/10 bg-white/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Open Source · Turborepo
            </span>
          </div>

          <h1
            data-animate=""
            className="font-mono font-bold tracking-tighter leading-none text-zinc-50 mb-6"
            style={
              {
                "--animate-delay": "80ms",
                fontSize: "clamp(2.5rem, 5vw, 5.5rem)",
                whiteSpace: "pre-line",
              } as React.CSSProperties
            }
          >
            {headline}
          </h1>

          <p
            data-animate=""
            className="text-zinc-400 font-light leading-relaxed mb-10 max-w-[48ch]"
            style={
              {
                "--animate-delay": "160ms",
                fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
              } as React.CSSProperties
            }
          >
            {subline}
          </p>

          <div
            data-animate=""
            style={{ "--animate-delay": "240ms" } as React.CSSProperties}
            className="flex flex-wrap items-center gap-3"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-zinc-950 font-mono text-sm font-medium transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              View on GitHub
            </a>
            <a
              href="#contact"
              className="inline-flex items-center px-6 py-2.5 rounded-full ring-1 ring-white/15 hover:ring-white/30 hover:bg-white/[0.04] active:scale-[0.97] text-zinc-200 font-mono text-sm font-medium transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Contact us
            </a>
          </div>
        </div>

        {/* Right — terminal */}
        <div className="flex justify-center lg:justify-end">
          <TerminalWindow />
        </div>
      </div>
    </section>
  );
}
