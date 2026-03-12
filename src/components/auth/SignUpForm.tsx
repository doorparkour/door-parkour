"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      toast.error("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      toast.error("Sign up failed", { description: error.message });
      setLoading(false);
      return;
    }

    setEmail(email);
    setDone(true);
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    setResending(false);
    if (error) {
      toast.error("Couldn't resend email", { description: error.message });
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-dp-teal">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then sign in.
        </p>
        <p className="text-xs text-muted-foreground">
          Not seeing it? Check your spam. If you already have an account, a
          sign-in link may have been sent instead.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending || resent}
          className="mt-1"
        >
          {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {resent ? "Email sent!" : "Resend confirmation email"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          placeholder="Jane Doe"
        />
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Min. 8 characters"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
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
        Create Account
      </Button>
    </form>
  );
}
