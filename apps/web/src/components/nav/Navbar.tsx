"use client";
import { useState } from "react";

const links = [
  { label: "Work", href: "#features" },
  { label: "Stack", href: "#stack" },
  { label: "Subscribe", href: "#subscribe" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <nav className="flex items-center gap-6 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <a href="https://devanddeliver.com" aria-label="Dev and Deliver">
            <svg
              viewBox="0 0 142 16"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-auto"
              aria-hidden="true"
            >
              <path
                d="M0 15.02V.401h5.32c1.187 0 2.251.192 3.14.576.908.384 1.658.907 2.251 1.57a6.324 6.324 0 011.36 2.32 8.88 8.88 0 01.454 2.826c0 1.117-.174 2.111-.506 3.018a6.244 6.244 0 01-1.447 2.303c-.629.645-1.396 1.134-2.268 1.483-.89.349-1.884.523-2.983.523 0-.017-5.321-.017-5.321 0zm9.647-7.327c0-.698-.105-1.343-.297-1.936a4.266 4.266 0 00-.837-1.518 3.84 3.84 0 00-1.378-.994 4.723 4.723 0 00-1.85-.349H2.81v9.647h2.477c.698 0 1.326-.122 1.866-.366a3.97 3.97 0 001.361-1.012c.366-.436.645-.942.837-1.535.21-.611.297-1.239.297-1.937zM19.485 15.229c-.872 0-1.64-.14-2.355-.436a5.605 5.605 0 01-1.797-1.204 5.585 5.585 0 01-1.152-1.78 5.84 5.84 0 01-.4-2.127c0-.768.121-1.5.383-2.181a5.51 5.51 0 011.134-1.797c.488-.523 1.099-.924 1.797-1.22a6.117 6.117 0 012.372-.454c.873 0 1.658.157 2.355.453.698.297 1.291.715 1.78 1.221a5.217 5.217 0 011.116 1.78c.262.68.384 1.378.384 2.093 0 .174 0 .349-.018.523 0 .157-.017.297-.052.419h-8.338c.034.419.14.802.314 1.134.157.331.383.61.645.837a2.898 2.898 0 001.919.733c.54 0 1.064-.14 1.553-.401.488-.262.82-.628.994-1.064l2.372.662c-.4.82-1.029 1.5-1.901 2.024-.872.523-1.902.785-3.105.785zm2.79-6.507c-.069-.802-.365-1.465-.889-1.954-.523-.488-1.169-.732-1.919-.732-.366 0-.715.07-1.046.192-.332.122-.611.314-.855.54a2.958 2.958 0 00-.61.838 3.186 3.186 0 00-.28 1.099l5.6.017zM29.43 15.02L25.451 4.222h2.844l2.739 8.548 2.756-8.548h2.599L32.413 15.02H29.43zM40.385 10.659l-1.448 4.36h-1.85l4.711-13.885h2.163l4.745 13.886h-1.919l-1.483-4.361h-4.92zm4.553-1.396l-1.36-3.995a25.853 25.853 0 01-.716-2.53h-.035c-.21.82-.436 1.675-.698 2.513l-1.36 4.012h4.169zM50.624 7.763c0-1.03-.017-1.867-.087-2.704h1.605l.105 1.64h.035c.488-.942 1.64-1.867 3.297-1.867 1.378 0 3.523.82 3.523 4.24v5.948h-1.814V9.28c0-1.604-.593-2.947-2.302-2.947-1.187 0-2.129.837-2.425 1.849-.087.226-.122.54-.122.837v6.001h-1.815V7.763zM70.668.401v12.055c0 .89.018 1.901.087 2.582h-1.622l-.087-1.728h-.035c-.558 1.117-1.78 1.954-3.402 1.954-2.407 0-4.256-2.04-4.256-5.059-.018-3.314 2.04-5.355 4.465-5.355 1.518 0 2.547.715 3.001 1.517h.035V.401h1.814zm-1.814 8.723c0-.227-.018-.541-.087-.768-.262-1.151-1.256-2.093-2.617-2.093-1.867 0-2.983 1.64-2.983 3.855 0 2.024.994 3.68 2.948 3.68 1.221 0 2.32-.802 2.652-2.162.07-.244.087-.489.087-.785V9.124zM73.686 15.02V.401h5.321c1.186 0 2.233.192 3.14.576.907.384 1.657.907 2.25 1.57a6.326 6.326 0 011.361 2.32 8.88 8.88 0 01.454 2.826c0 1.117-.175 2.111-.506 3.018a6.243 6.243 0 01-1.448 2.303c-.628.645-1.396 1.134-2.268 1.483-.89.349-1.884.523-2.983.523 0-.017-5.32-.017-5.32 0zm9.665-7.327c0-.698-.105-1.343-.297-1.936a4.267 4.267 0 00-.837-1.518 3.84 3.84 0 00-1.378-.994 4.722 4.722 0 00-1.85-.349h-2.476v9.647h2.477c.698 0 1.326-.122 1.866-.366.541-.245.995-.594 1.361-1.012.366-.436.645-.942.837-1.535.21-.611.297-1.239.297-1.937zM93.19 15.229c-.873 0-1.64-.14-2.355-.436a5.604 5.604 0 01-1.797-1.204 5.585 5.585 0 01-1.151-1.78 5.84 5.84 0 01-.402-2.127c0-.768.123-1.5.384-2.181a5.513 5.513 0 011.134-1.797c.489-.523 1.1-.924 1.797-1.22a6.118 6.118 0 012.372-.454c.873 0 1.658.157 2.355.453.698.297 1.291.715 1.78 1.221a5.217 5.217 0 011.116 1.78c.262.68.384 1.378.384 2.093 0 .174 0 .349-.017.523 0 .157-.018.297-.053.419H90.4c.034.419.14.802.314 1.134.157.331.383.61.645.837a2.896 2.896 0 001.919.733c.54 0 1.064-.14 1.553-.401.488-.262.82-.628.994-1.064l2.39.662c-.401.82-1.03 1.5-1.902 2.024-.89.523-1.918.785-3.122.785zm2.79-6.507c-.069-.802-.365-1.465-.889-1.954-.523-.488-1.169-.732-1.919-.732-.366 0-.715.07-1.046.192a2.55 2.55 0 00-.855.54 2.958 2.958 0 00-.61.838 3.186 3.186 0 00-.28 1.099l5.6.017zM100.498 0h2.756v11.583c0 .402.087.716.297.925.192.227.471.331.82.331.157 0 .349-.035.54-.087a3.08 3.08 0 00.559-.21l.366 2.094a5.893 5.893 0 01-1.291.419 7.81 7.81 0 01-1.343.14c-.872 0-1.535-.228-2.006-.699-.471-.453-.716-1.116-.716-1.97V0h.018zM107.041 2.739V0h2.756v2.739h-2.756zm0 12.28V4.24h2.756v10.798l-2.756-.017zM115.206 15.02l-3.977-10.798h2.843l2.739 8.548 2.756-8.548h2.599l-3.977 10.798h-2.983zM128.236 15.229c-.873 0-1.64-.14-2.355-.436a5.604 5.604 0 01-1.797-1.204 5.592 5.592 0 01-1.152-1.78 5.854 5.854 0 01-.401-2.127c0-.768.122-1.5.384-2.181a5.509 5.509 0 011.134-1.797c.488-.523 1.099-.924 1.797-1.22a6.115 6.115 0 012.372-.454c.872 0 1.657.157 2.355.453a5.393 5.393 0 011.78 1.221 5.228 5.228 0 011.116 1.78c.262.68.384 1.378.384 2.093 0 .174 0 .349-.018.523 0 .157-.017.297-.052.419h-8.338c.034.419.139.802.314 1.134.157.331.383.61.645.837a2.897 2.897 0 001.919.733c.541 0 1.064-.14 1.552-.401.489-.262.82-.628.995-1.064l2.372.662c-.401.82-1.029 1.5-1.901 2.024-.855.523-1.902.785-3.105.785zm2.808-6.507c-.07-.802-.366-1.465-.889-1.954-.524-.488-1.169-.732-1.919-.732-.367 0-.716.07-1.047.192a2.553 2.553 0 00-.855.54 2.962 2.962 0 00-.61.838 3.166 3.166 0 00-.279 1.099l5.599.017zM142 6.629c-.838.017-1.588.174-2.251.488-.663.314-1.134.768-1.413 1.396v6.524h-2.756V4.24h2.53v2.303c.191-.367.418-.698.68-.995a4.94 4.94 0 01.837-.767c.297-.227.611-.384.925-.506.314-.122.61-.175.89-.175h.331c.07 0 .14 0 .209.018L142 6.629z"
                fill="inherit"
              />
            </svg>
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-5">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors duration-300 cursor-pointer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <a
            href="#contact"
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium font-mono bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-[0.97] transition-[background-color,transform] duration-200"
          >
            Contact us
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden relative flex items-center justify-center p-3 cursor-pointer"
          >
            <div className="relative w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-px w-full bg-zinc-50 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                  open ? "rotate-45 translate-y-[0.625rem]" : ""
                }`}
              />
              <span
                className={`block h-px w-full bg-zinc-50 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-px w-full bg-zinc-50 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                  open ? "-rotate-45 -translate-y-[0.625rem]" : ""
                }`}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 backdrop-blur-2xl bg-zinc-950/90 flex flex-col justify-center px-8 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col gap-6">
          {links.map((link, i) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block font-mono text-4xl font-bold tracking-tighter text-zinc-50 transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                  open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          onClick={() => setOpen(false)}
          className={`mt-10 self-start inline-flex items-center px-6 py-3 rounded-full font-mono text-sm font-medium bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-[background-color,transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: open ? `${links.length * 60}ms` : "0ms" }}
        >
          Contact us
        </a>
      </div>
    </>
  );
}
