import type { FeatureContent } from "@repo/types";
import { SectionHeading } from "@/components/SectionHeading";

function FeatureCard({ item }: { item: FeatureContent }) {
  const index = String(item.order).padStart(2, "0");
  return (
    /* Outer shell — Double-Bezel */
    <div className="h-full ring-1 ring-white/5 hover:ring-white/[0.12] p-1.5 rounded-[2rem] bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200">
      {/* Inner core */}
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-7 flex flex-col gap-5">
        {/* A running index, not a repeated icon: three identical glyphs carry no
            information and read as template. */}
        <span className="font-mono text-[10px] tracking-[0.2em] text-emerald-500 tabular-nums">
          {index}
        </span>
        <div>
          <h3 className="font-mono font-bold text-zinc-50 leading-tight mb-2 text-base tracking-tight">
            {item.title}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

interface FeaturesProps {
  items?: FeatureContent[];
}

export function Features({ items = [] }: FeaturesProps) {
  return (
    <section id="features" className="px-6 md:px-12 lg:px-20 pt-24 md:pt-32 pb-28 md:pb-40">
      {/* Section header */}
      <SectionHeading index="01" label="The starter" title="What's in the box." className="mb-14" />

      {/* Asymmetric grid: tall card left, two stacked right */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] md:grid-rows-2 gap-3">
        {/* First item — spans 2 rows */}
        <div data-animate="" className="md:row-span-2">
          <FeatureCard item={items[0]!} />
        </div>
        {/* Stacked items */}
        {items.slice(1).map((item, i) => (
          <div
            key={item.title}
            data-animate=""
            style={{ "--animate-delay": `${(i + 1) * 80}ms` } as React.CSSProperties}
          >
            <FeatureCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
