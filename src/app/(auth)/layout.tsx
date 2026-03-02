import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-16 items-center px-6 bg-dp-teal">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/door-parkour-logo.jpg"
            alt="Door Parkour logo"
            width={20}
            height={20}
            className="h-5 w-5 rounded-sm object-cover"
          />
          <span className="font-bold text-white">Door Parkour</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
