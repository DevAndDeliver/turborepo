"use client";

import Cal from "@calcom/embed-react";

import { CAL_LINK, CAL_URL, CONTACT_EMAIL } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";

export function Contact() {
  return (
    <section id="contact" className="px-6 md:px-12 lg:px-20 pt-24 md:pt-32 pb-32 md:pb-44">
      <div className="max-w-5xl">
        {/* Header */}
        <SectionHeading index="04" label="Contact" title="Let's talk." className="mb-4" />
        <div data-animate="" className="mb-12">
          <p className="text-zinc-400 font-light leading-relaxed max-w-[48ch]">
            Book a call directly or reach out by email.{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-zinc-200 underline underline-offset-2 hover:text-emerald-400 transition-colors duration-200"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {/* Inline Cal embed */}
        <div
          data-animate=""
          style={{ "--animate-delay": "120ms" } as React.CSSProperties}
          className="rounded-xl overflow-hidden ring-1 ring-white/8 bg-zinc-900/50"
        >
          <Cal
            calLink={CAL_LINK}
            calOrigin={CAL_URL}
            embedJsUrl={`${CAL_URL}/embed/embed.js`}
            style={{ width: "100%", minHeight: "600px" }}
            config={{ layout: "month_view", theme: "dark" }}
          />
        </div>
      </div>
    </section>
  );
}
