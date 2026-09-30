import type { MetadataRoute } from "next";
import products from "@/data/products.json";
import { courses } from "@/data/akademie";
import { categories } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://trinkgut-jammers.de";

  // Statische Routes mit individueller Priorität
  const routes: { path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/produkte", priority: 0.9, changeFrequency: "daily" },
    { path: "/angebote", priority: 0.9, changeFrequency: "daily" },
    { path: "/handzettel", priority: 0.9, changeFrequency: "weekly" },
    { path: "/eigenmarke", priority: 0.9, changeFrequency: "monthly" },
    { path: "/akademie", priority: 0.8, changeFrequency: "weekly" },
    { path: "/cocktails", priority: 0.8, changeFrequency: "weekly" },
    { path: "/finder", priority: 0.8, changeFrequency: "weekly" },
    { path: "/partyplaner", priority: 0.8, changeFrequency: "weekly" },
    { path: "/vermietung", priority: 0.8, changeFrequency: "monthly" },
    { path: "/galerie", priority: 0.7, changeFrequency: "monthly" },
    { path: "/community", priority: 0.7, changeFrequency: "weekly" },
    { path: "/gewinnspiel", priority: 0.7, changeFrequency: "monthly" },
    { path: "/leergut", priority: 0.7, changeFrequency: "monthly" },
    { path: "/oeko-tracker", priority: 0.6, changeFrequency: "weekly" },
    { path: "/partyspiele", priority: 0.7, changeFrequency: "monthly" },
    { path: "/nl", priority: 0.7, changeFrequency: "weekly" },
    { path: "/kontakt", priority: 0.7, changeFrequency: "yearly" },
    { path: "/bewerbung", priority: 0.6, changeFrequency: "monthly" },
    { path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
    { path: "/datenschutz", priority: 0.3, changeFrequency: "yearly" },
    { path: "/agb", priority: 0.3, changeFrequency: "yearly" },
  ];

  return [...routes,...products.map(product=>({path:`/produkte/${product.slug}`,priority:0.7,changeFrequency:"monthly" as const})),...categories.map(category=>({path:`/kategorie/${category.slug}`,priority:0.8,changeFrequency:"monthly" as const})),...courses.map(course=>({path:`/akademie/${course.slug}`,priority:0.6,changeFrequency:"monthly" as const}))].map((r) => ({
    url: `${baseUrl}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
