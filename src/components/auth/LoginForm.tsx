"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("deleted") === "1") {
      toast.success("Your account has been deleted.");
      router.replace("/login");
    }
  }, [searchParams, router]);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(email);
      } else {
        const ERROR_MESSAGES: Record<string, string> = {
          "invalid login credentials": "Incorrect email or password.",
          "too many requests":
            "Too many attempts. Please wait a moment and try again.",
        };
        const friendly =
          ERROR_MESSAGES[error.message.toLowerCase()] ?? error.message;
        toast.error("Sign in failed", { description: friendly });
      }
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleResend() {
    if (!unconfirmedEmail) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    setResending(false);
    if (error) {
      toast.error("Couldn't resend email", { description: error.message });
    } else {
      toast.success("Confirmation email resent!");
    }
  }

  if (unconfirmedEmail) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm font-medium text-dp-teal">Email not confirmed</p>
        <p className="text-sm text-muted-foreground">
          Please check your inbox for <strong>{unconfirmedEmail}</strong> and
          click the confirmation link before signing in.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
          className="mt-1"
        >
          {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Resend confirmation email
        </Button>
        <button
          className="text-xs text-muted-foreground underline"
          onClick={() => setUnconfirmedEmail(null)}
        >
          Back to sign in
        </button>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-dp-orange hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-dp-orange text-white hover:bg-dp-orange-dark"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}
