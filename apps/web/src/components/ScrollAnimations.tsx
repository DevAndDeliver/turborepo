"use client";
import { useEffect } from "react";

export function ScrollAnimations() {
  useEffect(() => {
    // rAF ensures the browser has painted the initial opacity:0 state
    // before the observer fires, so the CSS transition is actually visible.
    const raf = requestAnimationFrame(() => {
      const elements = document.querySelectorAll<HTMLElement>("[data-animate]");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-visible", "");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
      );

      elements.forEach((el) => observer.observe(el));
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
