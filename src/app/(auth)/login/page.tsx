import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-dp-teal">Welcome back</CardTitle>
        <CardDescription>Sign in to manage your bookings and profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href="/signup" className="text-dp-orange font-medium hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
