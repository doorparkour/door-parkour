import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Award,
  Users,
  Calendar,
  ArrowRight,
  Shield,
  Zap,
  TreePine,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-dp-teal text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, #F7941D 0%, transparent 60%), radial-gradient(circle at 75% 20%, #2E6F8E 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <Badge className="mb-6 bg-dp-orange/20 text-dp-orange border-dp-orange/30 hover:bg-dp-orange/20">
            UPDATES COMING SOON
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Parkour coaching in{" "}
            <span className="text-dp-orange">Door County</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
            Door County&apos;s only{" "}
            <span className="font-semibold text-white">ADAPT-certified</span>{" "}
            parkour coach. Learn to move freely through Sturgeon Bay&apos;s
            stunning outdoor environments — all skill levels welcome.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/classes">
              <Button
                size="lg"
                className="bg-dp-orange text-white hover:bg-dp-orange-dark gap-2"
              >
                Browse Classes <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                About Your Coach
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-dp-orange" />
              Sturgeon Bay, WI
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-dp-orange" />
              ADAPT Certified
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-dp-orange" />
              All levels welcome
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-dp-teal sm:text-4xl">
              Why Door Parkour?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Movement education rooted in safety, creativity, and the beauty
              of Door County.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Award,
                title: "ADAPT Certified",
                desc: "The only ADAPT-certified parkour coach in Door County — trained to the highest professional standard in the industry.",
              },
              {
                icon: TreePine,
                title: "Outdoor Environments",
                desc: "Classes take place in Door County's incredible outdoor spaces. Parks, trails, and urban areas all become your playground.",
              },
              {
                icon: Shield,
                title: "Safety First",
                desc: "Progressive curriculum with a strong emphasis on technique, body mechanics, and building confidence before complexity.",
              },
              {
                icon: Users,
                title: "Small Groups",
                desc: "Limited class sizes mean individual attention. Whether you're brand new or have some experience, you'll be challenged.",
              },
              {
                icon: Zap,
                title: "All Skill Levels",
                desc: "From first jump to advanced flows — classes are structured for beginners through intermediate movers.",
              },
              {
                icon: Calendar,
                title: "Flexible Schedule",
                desc: "Flexible scheduling across multiple days and times. Book individual sessions or commit to a series for the best results.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-dp-teal/10">
                    <Icon className="h-6 w-6 text-dp-teal" />
                  </div>
                  <h3 className="text-lg font-semibold text-dp-teal">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-dp-orange py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start moving?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Classes in Sturgeon Bay are launching soon. Updates and details are
            coming soon.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-dp-orange hover:bg-white/90 font-semibold"
              >
                Create an Account
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                See the Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
