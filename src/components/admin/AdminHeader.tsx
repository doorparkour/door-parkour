"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Calendar, ShoppingBag, LayoutGrid, TicketCheck, RotateCcw, MessageSquareQuote } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/classes", icon: Calendar, label: "Classes" },
  { href: "/admin/bookings", icon: TicketCheck, label: "Bookings" },
  { href: "/admin/products", icon: ShoppingBag, label: "Products" },
  { href: "/admin/refund-requests", icon: RotateCcw, label: "Refund Requests" },
  { href: "/admin/member-feedback", icon: MessageSquareQuote, label: "Member feedback" },
];

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
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
  );
}

export default function AdminHeader() {
  return (
    <header className="flex h-16 items-center border-b bg-background px-4 lg:px-8">
      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b px-5">
              <Image
                src="/door-parkour-logo.jpg"
                alt="Door Parkour logo"
                width={20}
                height={20}
                className="h-5 w-5 rounded-sm object-cover"
              />
              <span className="text-sm font-bold text-dp-teal">Admin</span>
            </div>
            <AdminNav />
            <div className="border-t p-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LayoutGrid className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="text-sm font-semibold text-dp-teal uppercase tracking-wide">
        Admin Panel
        </span>
      </div>
    </header>
  );
}
