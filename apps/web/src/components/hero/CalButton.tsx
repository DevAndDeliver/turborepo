"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

import { CAL_LINK, CAL_URL } from "@/lib/site";

interface CalButtonProps {
  label: string;
  size?: "sm" | "md";
}

export function CalButton({ label, size = "md" }: CalButtonProps) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi(`${CAL_URL}/embed/embed.js`);
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  const isSm = size === "sm";

  return (
    <button
      type="button"
      data-cal-link={CAL_LINK}
      data-cal-origin={CAL_URL}
      data-cal-config='{"layout":"month_view"}'
      className={`group inline-flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-zinc-950 font-mono font-medium transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
        isSm ? "pl-4 pr-1.5 py-1.5 text-xs" : "pl-6 pr-2 py-2 text-sm"
      }`}
    >
      {label}
      <span
        className={`rounded-full bg-zinc-950/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isSm ? "w-6 h-6" : "w-8 h-8"
        }`}
      >
        <svg
          width={isSm ? 10 : 14}
          height={isSm ? 10 : 14}
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5.5M11.5 2.5V8.5" />
        </svg>
      </span>
    </button>
  );
}
