import Link from "next/link";
import type { Category } from "@/lib/utils";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/kategorie/${category.slug}`}
      className={`group relative flex flex-col items-center gap-3 rounded-2xl overflow-hidden card-hover aspect-square bg-gradient-to-br ${category.gradient}`}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.4),transparent_60%)]" />
      {/* Big emoji */}
      <div className="absolute inset-0 flex items-center justify-center pb-10">
        <span className="text-6xl md:text-7xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
          {category.icon}
        </span>
      </div>
      {/* Bottom gradient + label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-12 pb-5">
        <span className="block font-bold text-white text-sm text-center drop-shadow-lg tracking-wide group-hover:-translate-y-1 transition-transform duration-500">
          {category.name}
        </span>
        <div className="mx-auto w-0 group-hover:w-8 h-px bg-[#F59E0B] mt-2 transition-all duration-500" />
      </div>
    </Link>
  );
}
