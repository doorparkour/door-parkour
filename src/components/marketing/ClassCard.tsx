"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Clock, Loader2, FileSignature } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

interface ClassCardProps {
  cls: ClassRow;
  /** When logged in and false, show Sign Waiver instead of Book. Undefined when not logged in. */
  waiverSigned?: boolean;
}

function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(isoString));
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const FALLBACK_IMG = "/door-parkour-banner.jpg";

export default function ClassCard({ cls, waiverSigned }: ClassCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState(cls.image_url || FALLBACK_IMG);
  const imgRef = useRef<HTMLImageElement>(null);
  const isFull = cls.spots_remaining === 0;

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImgSrc(FALLBACK_IMG);
    }
  }, []);

  async function handleBook() {
    setLoading(true);
    const res = await fetch("/api/checkout/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: cls.id }),
    });

    if (res.status === 401) {
      router.push(`/login?redirectTo=/classes`);
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.url) {
      if (res.status === 403) {
        toast.error("Sign waiver required", {
          description: data.error ?? "You must sign the waiver before booking.",
        });
      } else {
        toast.error("Booking failed", { description: data.error ?? "Please try again." });
      }
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <Card className="flex flex-col overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imgSrc}
          alt={cls.title}
          className="h-full w-full object-cover object-center"
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
      </div>

      <CardContent className="flex-1 pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dp-teal">{cls.title}</h3>
          {isFull ? (
            <Badge variant="secondary" className="shrink-0">
              Full
            </Badge>
          ) : (
            <Badge className="shrink-0 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              {cls.spots_remaining} left
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {cls.age_group === "youth" ? "Ages 8–13" : "Ages 14+"}
        </p>

        {cls.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cls.description}
          </p>
        )}

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-dp-orange shrink-0" />
            {formatDate(cls.starts_at)} · {cls.duration_mins} min
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-dp-orange shrink-0" />
            {cls.location}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <span className="text-lg font-bold text-dp-teal">
          {formatPrice(cls.price_cents)}
        </span>
        {waiverSigned === false ? (
          <Button
            size="sm"
            asChild
            className="bg-dp-orange text-white hover:bg-dp-orange-dark"
          >
            <Link href="/waiver?redirectTo=/classes">
              <FileSignature className="mr-1.5 h-3.5 w-3.5" />
              Sign Waiver
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={isFull || loading}
            onClick={handleBook}
            className="bg-dp-orange text-white hover:bg-dp-orange-dark disabled:opacity-50"
          >
            {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isFull ? "Waitlist" : "Book Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
