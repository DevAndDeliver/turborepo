import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import { ScrollAnimations } from "@/components/ScrollAnimations";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

// Swap all of this for your own — see "Making it yours" in the README.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devanddeliver.com";

// Social preview card. Must be an absolute URL — crawlers do not resolve
// relative paths (metadataBase below is what makes a relative one absolute if
// you swap in a local file).
//
// KNOWN LIMITATION: this placeholder is AVIF at 1294x878. Facebook, LinkedIn
// and X do not reliably decode AVIF for og:image, and none of them are given
// the 1.91:1 crop they expect — so treat this as a stand-in that keeps the
// tags well-formed, not as a working card. Replace it with a 1200x630 JPEG or
// PNG and update the dimensions below.
const OG_IMAGE = "https://admin.devanddeliver.com/uploads/about4_d9b2a1370c_5a740f57ad.avif";
const OG_IMAGE_WIDTH = 1294;
const OG_IMAGE_HEIGHT = 878;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Dev and Deliver",
  description:
    "We build full-stack products with TypeScript. Open-source Turborepo starter — NestJS, Next.js, Tailwind v4.",
  openGraph: {
    title: "Dev and Deliver",
    description: "We build full-stack products with TypeScript.",
    url: SITE_URL,
    siteName: "Dev and Deliver",
    images: [
      { url: OG_IMAGE, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: "Dev and Deliver" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dev and Deliver",
    description: "We build full-stack products with TypeScript.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${ibmPlexSans.variable}`}>
      <body className="bg-zinc-950 text-zinc-50 font-sans antialiased overflow-x-hidden">
        <ScrollAnimations />
        {children}
      </body>
    </html>
  );
}
