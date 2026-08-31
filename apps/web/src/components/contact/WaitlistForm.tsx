"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreateWaitlistEntrySchema } from "@repo/types";
import { Input } from "@repo/ui";
import { API_URL } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";

type FormState = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = { email: fd.get("email") as string };

    const result = CreateWaitlistEntrySchema.safeParse(raw);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = String(issue.path[0]);
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setGlobalError(null);
    setState("loading");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(`${API_URL}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(String(res.status));
      setState("success");
    } catch {
      setState("error");
      setGlobalError("Something went wrong. Please try again.");
    }
  }

  const transition = { duration: 0.4, ease: [0.32, 0.72, 0, 1] as const };
  const fadeSlide = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition,
  };

  const inputClass =
    "bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <section id="subscribe" className="px-6 md:px-12 lg:px-20 py-20 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start max-w-5xl">
        {/* Copy block */}
        <div data-animate="">
          <SectionHeading
            index="03"
            label="Stay in the loop"
            title="Get notified when we publish."
            className="mb-4"
          />
          <p className="text-zinc-400 leading-relaxed font-light max-w-[40ch]">
            We&apos;re building this Turborepo in public. Subscribe to get notified when each
            article in the series drops.
          </p>
        </div>

        {/* Form / success */}
        <div data-animate="" style={{ "--animate-delay": "120ms" } as React.CSSProperties}>
          <ul className="flex flex-col gap-3 mb-8">
            {[
              "One email per article — no noise",
              "Real decisions, real tradeoffs, real code",
              "Unsubscribe any time",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 flex items-center justify-center">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                    <path
                      d="M1 3L3 5L7 1"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm text-zinc-400 font-light">{item}</span>
              </li>
            ))}
          </ul>

          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div key="success" {...fadeSlide}>
                <div className="ring-1 ring-white/5 p-1.5 rounded-[2rem] bg-white/[0.02]">
                  <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-8">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mb-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <p className="font-mono font-bold text-zinc-50 text-lg mb-1">
                      You&apos;re subscribed.
                    </p>
                    <p className="text-sm text-zinc-400">
                      We&apos;ll let you know when the next article drops.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                {...fadeSlide}
                className="flex flex-col gap-4"
              >
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="jane@example.com"
                  required
                  error={fieldErrors.email}
                  className={inputClass}
                />

                {state === "error" && globalError && (
                  <p className="text-xs text-red-400">{globalError}</p>
                )}

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="w-full h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-mono text-sm font-medium transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {state === "loading" ? "Subscribing…" : "Subscribe"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
