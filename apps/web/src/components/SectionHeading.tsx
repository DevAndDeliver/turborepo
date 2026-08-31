interface SectionHeadingProps {
  index: string;
  label: string;
  title: string;
  className?: string;
}

/**
 * Shared section opener: index, label, hairline rule, then the heading.
 *
 * Replaces the pill kicker that previously sat above all five sections. Five
 * identical tracked labels read as scaffolding rather than a system; a running
 * index reads as one, and echoes the numbering the articles list already uses.
 */
export function SectionHeading({ index, label, title, className = "" }: SectionHeadingProps) {
  return (
    <div data-animate="" className={className}>
      <div className="flex items-center gap-4 mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-emerald-500 tabular-nums shrink-0">
          {index}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 shrink-0">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent"
        />
      </div>
      <h2
        className="font-mono font-bold text-zinc-50 tracking-tighter leading-none"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        {title}
      </h2>
    </div>
  );
}
