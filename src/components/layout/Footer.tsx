import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dp-teal text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/door-parkour-logo.jpg"
                alt="Door Parkour logo"
                width={20}
                height={20}
                className="h-5 w-5 rounded-sm object-cover"
              />
              <span className="font-bold tracking-tight">Door Parkour</span>
            </Link>
            <p className="mt-3 text-sm text-white/60">
              Door County&apos;s only ADAPT-certified parkour coaching.
              Outdoor classes in Sturgeon Bay, WI.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">
              Navigate
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {[
                { href: "/classes", label: "Classes" },
                { href: "/about", label: "About" },
                { href: "/merch", label: "Merch" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">
              Account
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {[
                { href: "/login", label: "Sign In" },
                { href: "/signup", label: "Create Account" },
                { href: "/dashboard", label: "My Dashboard" },
                { href: "/bookings", label: "My Bookings" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Door Parkour · Sturgeon Bay, WI ·{" "}
          <a
            href="mailto:hello@doorparkour.com"
            className="hover:text-white/70 transition-colors"
          >
            hello@doorparkour.com
          </a>
        </div>
      </div>
    </footer>
  );
}
