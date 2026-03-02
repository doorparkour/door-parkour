import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = { title: "Profile Settings" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your personal info and emergency contact details.
        </p>
      </div>
      <ProfileForm profile={profile} email={user!.email ?? ""} />
    </div>
  );
}
