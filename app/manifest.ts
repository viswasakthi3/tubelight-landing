import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tubelight — Visual Learning Platform",
    short_name: "Tubelight",
    description:
      "The visual learning platform that turns complex reading into instant UI diagrams and voice walkthroughs on Windows.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#fbf8f3",
    icons: [
      {
        src: "/brand/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
