"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      toast.error("Something went wrong", { description: error.message });
      setLoading(false);
      return;
    }

    setEmail(email);
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-dp-teal">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          If <strong>{email}</strong> has an account, you&apos;ll receive a
          password reset link shortly.
        </p>
        <p className="text-xs text-muted-foreground">
          Check your spam folder if it doesn&apos;t arrive within a few minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-dp-orange text-white hover:bg-dp-orange-dark"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
