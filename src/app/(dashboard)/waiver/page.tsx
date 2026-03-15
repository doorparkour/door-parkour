import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaiverSignForm from "@/components/waiver/WaiverSignForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign Waiver",
  description: "Sign the liability waiver to book Door Parkour classes.",
};

export default async function WaiverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("waiver_signed_at")
        .eq("id", user.id)
        .single()
    : { data: null };

  if (profile?.waiver_signed_at) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-dp-teal">Waiver</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve already signed the liability waiver.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
          <CircleCheck className="h-8 w-8 shrink-0 text-green-600" />
          <div>
            <p className="font-medium">Signed on</p>
            <p className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(new Date(profile.waiver_signed_at))}
            </p>
          </div>
        </div>
        <Link href="/classes">
          <Button className="bg-dp-orange text-white hover:bg-dp-orange-dark">
            Browse Classes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Sign Waiver</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You must sign the liability waiver before booking a class.
        </p>
      </div>
      <WaiverSignForm />
    </div>
  );
}
