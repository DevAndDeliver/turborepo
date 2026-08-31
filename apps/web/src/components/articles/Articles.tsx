import type { ArticleTeaserContent } from "@repo/types";
import { SectionHeading } from "@/components/SectionHeading";

interface ArticlesProps {
  articles: ArticleTeaserContent[];
}

export function Articles({ articles }: ArticlesProps) {
  return (
    <section id="articles" className="px-6 md:px-12 lg:px-20 py-24 md:py-32">
      <div className="max-w-5xl">
        {/* Section header */}
        <SectionHeading index="02" label="The series" title="How we built this." />
        <div data-animate="" className="mb-16">
          <p className="mt-4 text-zinc-400 font-light leading-relaxed max-w-[55ch]">
            Six articles documenting the real process — from repo structure to deployment. Published
            on{" "}
            <a
              href="https://devanddeliver.com/blog"
              className="text-zinc-300 underline underline-offset-2 hover:text-zinc-50 transition-colors duration-200"
            >
              devanddeliver.com
            </a>
            .
          </p>
        </div>

        {/* Article list */}
        <div className="flex flex-col">
          {articles.map((article, i) => {
            const Tag = article.published ? "a" : "div";
            return (
              <Tag
                key={article.number}
                {...(article.published ? { href: article.href } : {})}
                data-animate=""
                style={{ "--animate-delay": `${i * 60}ms` } as React.CSSProperties}
                className={`group flex items-start gap-6 py-7 border-b border-zinc-800/60 last:border-b-0 ${
                  article.published ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Number */}
                <span className="font-mono text-[10px] text-zinc-600 tracking-widest pt-1 shrink-0 w-5">
                  {article.number}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-mono font-bold text-zinc-50 text-base tracking-tight leading-snug group-hover:text-emerald-400 transition-colors duration-200">
                      {article.title}
                    </h3>
                    {!article.published && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-zinc-600 ring-1 ring-zinc-700 rounded-full px-2 py-0.5">
                        Soon
                      </span>
                    )}
                    {article.published && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[transform,color] duration-200 mt-0.5"
                        aria-hidden="true"
                      >
                        <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5.5M11.5 2.5V8.5" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{article.excerpt}</p>
                </div>
              </Tag>
            );
          })}
        </div>
      </div>
    </section>
  );
}
