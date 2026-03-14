import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutGrid, Calendar, ShoppingBag } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-white lg:flex lg:flex-col">
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

        <nav className="flex-1 space-y-1 p-3">
          {[
            { href: "/admin/classes", icon: Calendar, label: "Classes" },
            { href: "/admin/products", icon: ShoppingBag, label: "Products" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
