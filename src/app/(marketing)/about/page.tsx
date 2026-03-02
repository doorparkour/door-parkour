import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, MapPin, BookOpen, Heart } from "lucide-react";
import Link from "next/link";
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-dp-teal/10 flex items-center justify-center">
                <span className="text-6xl">🏃</span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-dp-teal">
                Hi, I&apos;m your coach.
              </h2>
              <p className="mt-4 text-muted-foreground">
                I&apos;m a Sturgeon Bay native and the founder of Door Parkour —
                Door County&apos;s first dedicated parkour coaching program.
                After years of training and earning my ADAPT certification,
                I&apos;m bringing structured, safe, and seriously fun parkour
                coaching to the county I love.
              </p>
              <p className="mt-4 text-muted-foreground">
                ADAPT (Art du Déplacement and Parkour Teaching) is the gold
                standard certification for parkour instructors. It means
                I&apos;ve been trained not just to move well, but to teach
                well — with an emphasis on safety, progression, and adapting
                to each individual student.
              </p>
              <p className="mt-4 text-muted-foreground">
                Door County&apos;s parks, shorelines, and urban spaces make
                for incredible training environments. My classes are designed
                to help you discover movement freedom in the places you
                already love.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Badge className="bg-dp-teal/10 text-dp-teal border-dp-teal/20 hover:bg-dp-teal/10">
                  <Award className="mr-1.5 h-3 w-3" />
                  ADAPT Certified
                </Badge>
                <Badge className="bg-dp-teal/10 text-dp-teal border-dp-teal/20 hover:bg-dp-teal/10">
                  <MapPin className="mr-1.5 h-3 w-3" />
                  Sturgeon Bay, WI
                </Badge>
              </div>
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
            Summer 2026 classes in Sturgeon Bay. All levels. Small groups.
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
                className="border-white/30 text-white hover:bg-white/10"
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
