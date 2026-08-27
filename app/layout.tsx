import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Tubelight — select text, press Alt+E, understand instantly",
  description:
    "Tubelight explains whatever you highlight on Windows. Press Alt+E and get a drawn diagram plus a voice walking you through it, right beside what you're reading. Now in private beta.",
  applicationName: "Tubelight",
  authors: [{ name: "Tubelight" }],
  keywords: [
    "Tubelight",
    "explain anything",
    "visual explanations",
    "Windows app",
    "Alt+E",
    "AI diagrams",
    "voice narration",
    "study tool",
  ],
  openGraph: {
    title: "Tubelight — understand anything, instantly",
    description:
      "Highlight any text on Windows, press Alt+E, and a panel slides in with a drawn diagram and a voice that explains it. Private beta — request an invite.",
    url: siteUrl,
    siteName: "Tubelight",
    type: "website",
    images: [{ url: "/shots/hero-main.webp", width: 2368, height: 1154, alt: "Tubelight explaining a PDF beside it" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tubelight — understand anything, instantly",
    description:
      "Highlight any text on Windows, press Alt+E, and get a drawn explanation with a voice. Private beta.",
    images: ["/shots/hero-main.webp"],
  },
  icons: {
    icon: [{ url: "/brand/icon.png", type: "image/png" }],
    apple: [{ url: "/brand/icon-512.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Scroll reveals start hidden — without JS they must not blank the page. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
