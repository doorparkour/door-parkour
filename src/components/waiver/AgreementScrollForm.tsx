"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 20;

export interface AgreementScrollFormProps {
  title: string;
  content: string;
  agreeLabel: string;
  submitLabel: string;
  onSubmit: () => Promise<void>;
  scrollHint?: string;
  /** Optional wrapper - if provided, form renders without Card (e.g. inside Dialog) */
  asChild?: boolean;
}

export default function AgreementScrollForm({
  title,
  content,
  agreeLabel,
  submitLabel,
  onSubmit,
  scrollHint = "Scroll to the bottom to continue.",
  asChild = false,
}: AgreementScrollFormProps) {
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

  async function handleSubmit() {
    if (!agreed) return;
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <div className="space-y-6">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground"
        role="document"
      >
        <pre className="whitespace-pre-wrap font-sans">{content}</pre>
      </div>

      {!hasScrolledToBottom && (
        <p className="text-sm text-muted-foreground">{scrollHint}</p>
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
          {agreeLabel}
        </Label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!agreed || loading}
        className="bg-dp-orange text-white hover:bg-dp-orange-dark"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );

  if (asChild) {
    return formContent;
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      {formContent}
    </div>
  );
}
