import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Door Parkour in Sturgeon Bay, WI.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-dp-teal py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-dp-orange/20 text-dp-orange border-dp-orange/30 hover:bg-dp-orange/20">
            Get in Touch
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Questions about classes, private coaching, or just want to say hi?
            Drop a message and I&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-dp-teal">
                  Reach out anytime
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Whether you have questions about class content, skill
                  requirements, location details, or anything else — don&apos;t
                  hesitate to ask.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dp-teal/10">
                    <Mail className="h-4 w-4 text-dp-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-dp-teal">Email</p>
                    <a
                      href="mailto:steven@doorparkour.com"
                      className="text-sm text-muted-foreground hover:text-dp-orange transition-colors"
                    >
                      steven@doorparkour.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dp-teal/10">
                    <MapPin className="h-4 w-4 text-dp-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-dp-teal">Location</p>
                    <p className="text-sm text-muted-foreground">
                      Sturgeon Bay, WI (Door County)
                      <br />
                      Specific class locations provided upon booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dp-teal/10">
                    <Clock className="h-4 w-4 text-dp-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-dp-teal">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      Typically within 24 hours, Monday–Friday.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
