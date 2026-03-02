import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-16 items-center px-6 bg-dp-teal">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-dp-orange" fill="currentColor" />
          <span className="font-bold text-white">Door Parkour</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
