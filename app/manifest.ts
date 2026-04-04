import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IQMS by CIRCAI LTD",
    short_name: "IQMS",
    description:
      "Inventory and Quality Management System by CIRCAI LTD.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/circai.ico",
        sizes: "any",
        type: "image/x-icon"
      }
    ]
  };
}
