"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitMemberFeedback } from "@/lib/actions/member-feedback";
import {
  MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH,
  MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH,
} from "@/lib/member-feedback/constants";
import { Loader2 } from "lucide-react";

export default function MemberFeedbackForm() {
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await submitMemberFeedback(message, consent);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — we read every note. We&apos;re glad you trained with us.
      </p>
    );
  }

  const len = message.trim().length;
  const belowMin = len > 0 && len < MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member-feedback-message">Your review</Label>
        <Textarea
          id="member-feedback-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How was the class (content, pace, vibe) and the coaching (instruction, safety, energy)?"
          rows={5}
          maxLength={MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH}
          className="min-h-[120px] resize-y"
          disabled={pending}
          aria-invalid={belowMin || !!error}
        />
        <p className="text-xs text-muted-foreground">
          One-time review · {MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH}–{MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH}{" "}
          characters ({len}/{MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH})
        </p>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="member-feedback-consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(!!v)}
          disabled={pending}
        />
        <Label htmlFor="member-feedback-consent" className="text-sm font-normal leading-relaxed cursor-pointer">
          I agree Door Parkour may quote all or part of my message, with my first name or initials, on the
          website or social media for marketing.
        </Label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        disabled={pending || message.trim().length < MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH}
        className="bg-dp-orange text-white hover:bg-dp-orange-dark"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit review
      </Button>
    </form>
  );
}
