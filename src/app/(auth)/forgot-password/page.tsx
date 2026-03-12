import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-dp-teal">
          Forgot your password?
        </CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Remember it?&nbsp;
        <Link
          href="/login"
          className="text-dp-orange font-medium hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
