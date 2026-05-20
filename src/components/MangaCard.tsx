import Link from "next/link";

interface MangaCardProps {
  slug: string;
  title: string;
  coverImage: string;
  type: string;
}

const typeBadgeColor: Record<string, string> = {
  Manga: "bg-blue-600",
  Manhwa: "bg-purple-600",
  Manhua: "bg-green-600",
};

export default function MangaCard({ slug, title, coverImage, type }: MangaCardProps) {
  return (
    <Link href={`/manga/${slug}`} className="group flex-shrink-0 w-[140px] sm:w-[160px]">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-1.5">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className={`absolute top-1.5 right-1.5 ${typeBadgeColor[type] || "bg-gray-600"} text-white text-[10px] font-medium px-1.5 py-0.5 rounded`}>
          {type}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">
        {title}
      </p>
    </Link>
  );
}
