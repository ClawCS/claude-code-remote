import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/utils";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/kategorie/${category.slug}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl overflow-hidden card-hover aspect-square"
    >
      {/* Background Image with Ken Burns */}
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        className="object-cover ken-burns group-hover:scale-110 transition-transform duration-500"
      />
      {/* Red gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#B91C1C]/80 via-[#DC2626]/30 to-transparent group-hover:from-[#B91C1C]/90 group-hover:via-[#DC2626]/40 transition-all duration-500" />
      {/* Content with reveal animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-5">
        <span className="font-bold text-white text-sm text-center drop-shadow-lg tracking-wide group-hover:-translate-y-1 transition-transform duration-500">
          {category.name}
        </span>
        <div className="w-0 group-hover:w-8 h-px bg-[#F59E0B] mt-2 transition-all duration-500" />
      </div>
    </Link>
  );
}
