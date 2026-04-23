import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caretaking App",
    short_name: "Caretaking",
    description: "A generic caregiving app for shared timelines, reminders, and notifications.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1f7a6d",
    icons: []
  };
}
