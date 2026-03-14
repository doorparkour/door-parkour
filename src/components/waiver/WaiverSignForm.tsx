"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { WAIVER_TITLE, WAIVER_CONTENT } from "@/lib/waiver/content";

export default function WaiverSignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/classes";

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    if (!agreed) {
      toast.error("Please confirm you have read and agree to the waiver.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/waiver/sign", { method: "POST" });

    if (res.status === 401) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      toast.error("Failed to sign waiver", { description: data.error ?? "Please try again." });
      setLoading(false);
      return;
    }

    toast.success("Waiver signed successfully");
    router.push(redirectTo);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{WAIVER_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground"
          role="document"
        >
          <pre className="whitespace-pre-wrap font-sans">{WAIVER_CONTENT}</pre>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
          />
          <Label
            htmlFor="agree"
            className="cursor-pointer text-sm font-normal leading-relaxed"
          >
            I have read and agree to the waiver above.
          </Label>
        </div>

        <Button
          onClick={handleSign}
          disabled={!agreed || loading}
          className="bg-dp-orange text-white hover:bg-dp-orange-dark"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign Waiver
        </Button>
      </CardContent>
    </Card>
  );
}
