import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, display_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="print:hidden">
        <DashboardSidebar isAdmin={profile?.role === "admin"} />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="print:hidden">
          <DashboardHeader user={user} profile={profile} isAdmin={profile?.role === "admin"} />
        </div>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
