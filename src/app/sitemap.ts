import type { MetadataRoute } from "next"
import { contents } from "@/features/universe/data"

export default function sitemap(): MetadataRoute.Sitemap {
  const episodes = contents
    .filter((c) => c.type === "episode" || c.type === "bonus")
    .map((c) => ({
      url: `https://deer-devil.vercel.app/universe/${c.slug}`,
      lastModified: new Date(),
    }))

  return [
    {
      url: "https://deer-devil.vercel.app/universe",
      lastModified: new Date(),
    },
    ...episodes,
    {
      url: "https://deer-devil.vercel.app/universe/preface",
      lastModified: new Date(),
    },
    {
      url: "https://deer-devil.vercel.app/universe/afterword",
      lastModified: new Date(),
    },
  ]
}
