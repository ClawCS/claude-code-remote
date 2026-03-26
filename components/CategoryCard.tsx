import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/utils";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/kategorie/${category.slug}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl overflow-hidden card-hover aspect-square"
    >
      {/* Background Image */}
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        className="object-cover group-hover:scale-110 transition-transform duration-500"
      />
      {/* Red gradient overlay — from transparent to red */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#9B1B30]/80 via-[#C41E3A]/30 to-transparent group-hover:from-[#9B1B30]/90 group-hover:via-[#C41E3A]/40 transition-all duration-500" />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-5">
        <span className="font-bold text-white text-sm text-center drop-shadow-lg">
          {category.name}
        </span>
      </div>
    </Link>
  );
}
