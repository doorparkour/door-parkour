import type { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Create Account" };

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-dp-teal">
          Create your account
        </CardTitle>
        <CardDescription>
          Sign up to book classes, track your schedule, and buy merch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
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
