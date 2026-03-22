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
import { Loader2, UserX } from "lucide-react";
import { adminCancelBooking } from "@/lib/actions/admin";

type Props = {
  bookingId: string;
  className: string;
};

export default function AdminCancelBookingButton({ bookingId, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    const result = await adminCancelBooking(bookingId);

    if (result.error) {
      toast.error("Cancel failed", { description: result.error });
    } else {
      toast.success(
        result.refundEligible
          ? "Booking cancelled. Refund issued if 24h+ before class."
          : "Booking cancelled. No refund (within 24h of class)."
      );
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserX className="mr-2 h-4 w-4" />
          Cancel booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>
            Frees their spot (same as customer self-cancel). Full refund to the
            original payment method only if the class starts in more than 24
            hours and they paid with card. They&apos;ll get the usual
            cancellation email.
            <span className="mt-2 block text-muted-foreground">
              Use <strong>Refund</strong> instead if you only need to return
              money without freeing the roster spot.
            </span>
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Class: <strong>{className}</strong>
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleCancel} disabled={loading} variant="destructive">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
