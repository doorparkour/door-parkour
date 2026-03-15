import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default async function NotFound() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden bg-dp-teal text-white">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 50%, #F7941D 0%, transparent 60%), radial-gradient(circle at 75% 20%, #2E6F8E 0%, transparent 60%)",
            }}
          />
          <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
            <Image
              src="/door-parkour-logo.jpg"
              alt="Door Parkour"
              width={80}
              height={80}
              className="mb-8 rounded-lg object-cover"
            />
            <p className="text-8xl font-extrabold tracking-tighter text-dp-orange sm:text-9xl">
              404
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Wrong landing
            </h1>
            <p className="mt-3 max-w-md text-white/80">
              This page took a tumble. Head back to solid ground.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button
                  size="lg"
                  className="gap-2 bg-dp-orange text-white hover:bg-dp-orange-dark"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/classes">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Browse Classes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
