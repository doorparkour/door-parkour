import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WAIVER_TITLE, WAIVER_CONTENT } from "@/lib/waiver/content";
import WaiverPrintButton from "@/components/waiver/WaiverPrintButton";

export const metadata: Metadata = {
  title: "Waiver (PDF)",
  description: "View or download the Door Parkour liability waiver as PDF.",
};

export default function WaiverViewPage() {
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
          {WAIVER_CONTENT}
        </pre>
      </article>

      <p className="text-xs text-muted-foreground print:text-gray-600 print:text-sm">
        Use your browser&apos;s Print dialog and choose &quot;Save as PDF&quot; to
        download a copy for your records or to share with an attorney.
      </p>
    </div>
  );
}
