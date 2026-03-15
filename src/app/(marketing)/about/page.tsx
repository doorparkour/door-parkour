import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, MapPin, BookOpen, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Door County's only ADAPT-certified parkour coach, based in Sturgeon Bay, WI.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dp-teal py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-dp-orange/20 text-dp-orange border-dp-orange/30 hover:bg-dp-orange/20">
            Your Coach
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            About Door Parkour
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Door County&apos;s only ADAPT-certified parkour coach — bringing
            professional movement education to the most beautiful peninsula in
            Wisconsin.
          </p>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-dp-teal/10 flex items-center justify-center">
                <Image
                  src="/selfie.png"
                  alt="Coach portrait"
                  width={768}
                  height={768}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex max-w-xl flex-col">
              <h2 className="text-3xl font-bold text-dp-teal">
                Hi, I&apos;m your coach.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                I founded Door Parkour to build Door County&apos;s first
                dedicated parkour coaching program. I&apos;ve been training
                parkour since 2010, and I&apos;ve been ADAPT Level 1 certified
                since 2015.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                In Fall 2025, I started the Door County YMCA parkour program,
                and I&apos;m currently working toward ADAPT Level 2 after
                completing the Level 2 course in June 2025.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                I coach parkour to build community and share what parkour
                culture has to offer. That means practicing core values like
                cooperation, mutual respect, resilience, self-knowledge, and
                non-competitive growth. My classes focus on safety,
                progression, and adapting coaching to each student so you can
                build confidence and movement freedom at your own pace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Badge className="bg-dp-teal/10 text-dp-teal border-dp-teal/20 hover:bg-dp-teal/10">
                  <Award className="mr-1.5 h-3 w-3" />
                  ADAPT Level 1 (since 2015)
                </Badge>
                <Badge className="bg-dp-teal/10 text-dp-teal border-dp-teal/20 hover:bg-dp-teal/10">
                  <MapPin className="mr-1.5 h-3 w-3" />
                  Sturgeon Bay, WI
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold text-dp-teal">
                ADAPT Level 1 Certificate
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Verified credential. Open the image for full-size viewing.
              </p>
              <a
                href="/adapt-l1.png"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block overflow-hidden rounded-xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                aria-label="Open ADAPT Level 1 certificate image"
              >
                <Image
                  src="/adapt-l1.png"
                  alt="ADAPT Level 1 certification"
                  width={768}
                  height={1086}
                  className="h-auto w-full object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-dp-teal">
            What I believe about movement
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Movement is for everyone",
                desc: "Parkour has a reputation as extreme. I think of it as the most natural form of play — accessible to any age and fitness level when properly coached.",
              },
              {
                icon: BookOpen,
                title: "Technique before tricks",
                desc: "Landing safely, moving efficiently, and understanding your body are the foundation. The impressive stuff follows naturally.",
              },
              {
                icon: Award,
                title: "Professional standards matter",
                desc: "ADAPT certification exists for a reason. I teach from a curriculum built around pedagogy, risk management, and progressive skill development.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 text-dp-orange" />
                  <h3 className="mt-4 text-lg font-semibold text-dp-teal">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dp-teal py-16 text-center text-white">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-3xl font-bold">Ready to train?</h2>
          <p className="mt-3 text-white/70">
            Classes in Sturgeon Bay. All levels. Small groups.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/classes">
              <Button className="bg-dp-orange text-white hover:bg-dp-orange-dark">
                See Classes
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
