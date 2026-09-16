import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade to Tubelight Pro — Unlimited Visual Learning",
  description:
    "Upgrade your Tubelight plan. Get high-volume credits, faster real-time visual diagram rendering, advanced steering, and voice synthesis on Windows.",
  alternates: {
    canonical: "/upgrade",
  },
  openGraph: {
    title: "Upgrade to Tubelight Pro — Unlimited Visual Learning",
    description:
      "Unlock high-volume visual explanations, advanced reasoning models, and voice narration for learning fast on Windows.",
    url: "/upgrade",
  },
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
