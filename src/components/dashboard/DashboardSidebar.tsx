"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, ShoppingBag, User, ShieldCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/bookings", icon: Calendar, label: "My Bookings" },
  { href: "/orders", icon: ShoppingBag, label: "My Orders" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function DashboardSidebar({
  isAdmin = false,
  inSheet = false,
}: {
  isAdmin?: boolean;
  inSheet?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className={`w-60 shrink-0 border-r bg-white flex flex-col ${inSheet ? "" : "hidden lg:flex"}`}>
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <Image
          src="/door-parkour-logo.jpg"
          alt="Door Parkour logo"
          width={20}
          height={20}
          className="h-5 w-5 rounded-sm object-cover"
        />
        <Link
          href="/"
          className="text-sm font-bold text-dp-teal hover:text-dp-teal-light"
        >
          Door Parkour
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-dp-teal/10 text-dp-teal"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        <Link
          href="/classes"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-dp-orange hover:bg-dp-orange/10 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Browse Classes
        </Link>
        <Link
          href="/merch"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-dp-orange hover:bg-dp-orange/10 transition-colors"
        >
          <Store className="h-4 w-4" />
          Browse Merch
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </div>
    </aside>
  );
}
