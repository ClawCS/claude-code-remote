import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/utils";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/kategorie/${category.slug}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl overflow-hidden card-hover aspect-square border border-white/5 hover:border-[#F59E0B]/40 shadow-2xl shadow-black/40 transition-colors"
    >
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        unoptimized
      />
      {/* Bottom gradient + label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-14 pb-5">
        <span className="block font-bold text-white text-sm text-center drop-shadow-lg tracking-wide group-hover:-translate-y-1 transition-transform duration-500">
          {category.name}
        </span>
        <div className="mx-auto w-0 group-hover:w-8 h-px bg-[#F59E0B] mt-2 transition-all duration-500" />
      </div>
    </Link>
  );
}
