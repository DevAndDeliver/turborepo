"use client";

import { motion } from "framer-motion";

const packages = [
  { name: "@repo/types", label: "types:dev", status: "compiled", time: "0.1s", port: null },
  { name: "@repo/ui", label: "ui:dev", status: "compiled", time: "0.2s", port: null },
  { name: "@repo/api", label: "api:dev", status: "ready", time: "1.2s", port: "3001" },
  { name: "@repo/web", label: "web:dev", status: "ready", time: "0.7s", port: "3000" },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.6,
    },
  },
};

const row = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as const },
  },
};

export function TerminalWindow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="w-full max-w-lg lg:max-w-none rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] bg-zinc-900"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/80 border-b border-white/5">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 font-mono text-[11px] text-zinc-500 tracking-wide">
          turborepo — zsh
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 font-mono text-[13px] leading-relaxed space-y-1">
        {/* Command */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <span className="text-emerald-500">❯</span>
          <span className="text-zinc-200">pnpm dev</span>
        </motion.div>

        {/* Turbo header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.5 }}
          className="pt-2 text-zinc-600"
        >
          • turbo 2.9.18
        </motion.div>

        {/* Package rows */}
        <motion.div variants={container} initial="hidden" animate="show" className="pt-1 space-y-1">
          {packages.map((pkg) => (
            <motion.div key={pkg.name} variants={row} className="flex items-baseline gap-3">
              {/* Dim prefix */}
              <span className="text-zinc-600 shrink-0">{pkg.label}:</span>

              {/* Status */}
              <span className={pkg.status === "ready" ? "text-emerald-400" : "text-zinc-400"}>
                {pkg.status === "ready" ? "▲ ready" : "✓ compiled"}
              </span>

              {/* Port */}
              {pkg.port && <span className="text-emerald-500/80 text-[11px]">on :{pkg.port}</span>}

              {/* Time */}
              <span className="ml-auto text-zinc-600 text-[11px]">{pkg.time}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Summary line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="pt-3 text-zinc-400"
        >
          <span className="text-emerald-500">✓</span> Tasks:{" "}
          <span className="text-zinc-200">4 successful</span>
          {" · "}
          <span className="text-zinc-600">ready in 1.4s</span>
          {/* blinking cursor */}
          <span className="ml-1 inline-block w-2 h-[13px] bg-emerald-500 align-middle animate-[blink_1s_step-end_infinite]" />
        </motion.div>
      </div>
    </motion.div>
  );
}
