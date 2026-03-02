import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Confirm Email" };

export default function ConfirmPage() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
        <MailCheck className="h-14 w-14 text-dp-orange" />
        <h1 className="text-2xl font-bold text-dp-teal">Confirm your email</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          A confirmation link has been sent to your email. Click it to activate
          your account, then come back to sign in.
        </p>
        <Link href="/login">
          <Button className="mt-2 bg-dp-orange text-white hover:bg-dp-orange-dark">
            Go to Sign In
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
