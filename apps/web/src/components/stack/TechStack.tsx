const items = [
  "Next.js",
  "NestJS",
  "TypeScript",
  "Tailwind CSS",
  "Zod",
  "Turbo",
  "pnpm",
  "React 19",
];

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div
        aria-hidden="true"
        className={`flex shrink-0 gap-10 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {doubled.map((item, i) => (
          <span key={i} className="font-mono text-sm text-zinc-500 whitespace-nowrap select-none">
            {item}
            <span className="ml-10 text-zinc-700">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TechStack() {
  return (
    <section
      id="stack"
      aria-label="Technologies"
      className="py-12 md:py-14 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <div className="flex flex-col gap-5">
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>
    </section>
  );
}
