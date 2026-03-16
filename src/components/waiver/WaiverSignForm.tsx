"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AgreementScrollForm from "./AgreementScrollForm";
import { WAIVER_TITLE, WAIVER_CONTENT } from "@/lib/waiver/content";

export default function WaiverSignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/classes";

  async function handleSign() {
    const res = await fetch("/api/waiver/sign", { method: "POST" });

    if (res.status === 401) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      toast.error("Failed to sign waiver", { description: data.error ?? "Please try again." });
      throw new Error(data.error);
    }

    toast.success("Waiver signed successfully");
    router.push(redirectTo);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{WAIVER_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <AgreementScrollForm
          title={WAIVER_TITLE}
          content={WAIVER_CONTENT}
          agreeLabel="I have read and agree to the waiver above."
          submitLabel="Sign Waiver"
          onSubmit={handleSign}
          scrollHint="Scroll to the bottom of the waiver to continue."
          asChild
        />
      </CardContent>
    </Card>
  );
}
