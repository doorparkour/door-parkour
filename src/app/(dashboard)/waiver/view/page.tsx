import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  WAIVER_TITLE,
  WAIVER_CONTENT,
  WAIVER_SIGNATURE_PLACEHOLDER,
} from "@/lib/waiver/content";
import WaiverPrintButton from "@/components/waiver/WaiverPrintButton";

export const metadata: Metadata = {
  title: "Waiver (PDF)",
  description: "View or download the Door Parkour liability waiver as PDF.",
};

export default async function WaiverViewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, waiver_signed_at")
        .eq("id", user.id)
        .single()
    : { data: null };

  const signedAt = profile?.waiver_signed_at;
  const displayName = profile?.full_name?.trim() || "Participant";

  const signatureBlock =
    signedAt && user
      ? `Signed by: ${displayName}\nDate: ${new Intl.DateTimeFormat("en-US", {
          dateStyle: "long",
        }).format(new Date(signedAt))}`
      : WAIVER_SIGNATURE_PLACEHOLDER;

  const content = WAIVER_CONTENT.replace(
    WAIVER_SIGNATURE_PLACEHOLDER,
    signatureBlock
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:flex-col print:items-stretch">
        <div>
          <h1 className="text-2xl font-bold text-dp-teal print:text-black">
            {WAIVER_TITLE}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">
            Door Parkour — Wisconsin
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <WaiverPrintButton />
          <Button variant="outline" size="sm" asChild>
            <Link href="/waiver">Back to Waiver</Link>
          </Button>
        </div>
      </div>

      <article className="rounded-lg border bg-background p-6 print:border-0 print:bg-transparent print:p-0">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground print:text-black">
          {content}
        </pre>
      </article>

      <p className="text-xs text-muted-foreground print:text-gray-600 print:text-sm">
        Use your browser&apos;s Print dialog and choose &quot;Save as PDF&quot; to
        download a copy for your records or to share with an attorney.
      </p>
    </div>
  );
}
