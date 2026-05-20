import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ATSUMARU</h3>
            <p className="text-sm text-gray-500">Your favorite manga, manhwa, and manhua reader.</p>
          </div>

          <div>
            <h4 className="text-gray-300 font-semibold text-sm mb-3">Atsumaru</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/explore", label: "Advanced search" },
                { href: "/browse/popular", label: "Popular" },
                { href: "/browse/recently-added", label: "Recently added" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-300 font-semibold text-sm mb-3">Browse</h4>
            <ul className="space-y-2">
              {[
                { href: "/browse/trending", label: "Trending" },
                { href: "/browse/top-rated", label: "Top Rated" },
                { href: "/browse/most-bookmarked", label: "Most Bookmarked" },
                { href: "/browse/recently-updated", label: "Recently Updated" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-300 font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { href: "/auth/login", label: "Login" },
                { href: "/auth", label: "Sign up" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
          Atsumaru Clone &mdash; Built with Next.js
        </div>
      </div>
    </footer>
  );
}
