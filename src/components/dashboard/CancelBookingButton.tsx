"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cancelBooking } from "@/lib/actions/bookings";

const REFUND_HOURS = 24;

function formatTimeUntil(startsAt: string): string {
  const start = new Date(startsAt);
  const now = new Date();
  const ms = start.getTime() - now.getTime();

  if (ms <= 0) return "the class has already started";

  const totalHours = ms / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days >= 1) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours >= 1) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes >= 1 && days < 1) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.length ? `${parts.join(" ")} in advance` : "less than 1 minute in advance";
}

type Props = {
  bookingId: string;
  startsAt: string;
};

export default function CancelBookingButton({ bookingId, startsAt }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = new Date(startsAt);
  const now = new Date();
  const hoursUntilClass = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  const refundEligible = hoursUntilClass >= REFUND_HOURS;
  const timeUntil = formatTimeUntil(startsAt);

  async function handleCancel() {
    setLoading(true);
    const result = await cancelBooking(bookingId);

    if (result.error) {
      toast.error("Failed to cancel booking", { description: result.error });
    } else {
      toast.success(
        result.refundEligible
          ? "Booking cancelled. A refund will be issued within 5–10 business days."
          : "Booking cancelled"
      );
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          Cancel Booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                You&apos;re canceling <strong>{timeUntil}</strong>.
              </p>
              <p>
                Refunds require 24+ hours notice.{" "}
                {refundEligible ? (
                  <>You&apos;ll receive a full refund, and your spot will be released for others.</>
                ) : (
                  <>
                    No refund will be issued. Your spot will be released. This action cannot be
                    undone.
                  </>
                )}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Booking
          </Button>
          <Button
            variant={refundEligible ? "default" : "destructive"}
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
