"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WAIVER_TITLE, WAIVER_CONTENT } from "@/lib/waiver/content";

const SCROLL_THRESHOLD = 20;

export default function WaiverSignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/classes";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD) {
      setHasScrolledToBottom(true);
    }
  }, [hasScrolledToBottom]);

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
          ref={scrollRef}
          onScroll={checkScroll}
          className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground"
          role="document"
        >
          <pre className="whitespace-pre-wrap font-sans">{WAIVER_CONTENT}</pre>
        </div>

        {!hasScrolledToBottom && (
          <p className="text-sm text-muted-foreground">
            Scroll to the bottom of the waiver to continue.
          </p>
        )}

        <div className="flex items-start gap-2">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            disabled={!hasScrolledToBottom}
          />
          <Label
            htmlFor="agree"
            className={cn(
              "text-sm font-normal leading-relaxed",
              hasScrolledToBottom ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            )}
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
