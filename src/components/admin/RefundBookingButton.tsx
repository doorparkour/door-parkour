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
import { Loader2, DollarSign } from "lucide-react";
import { refundBooking } from "@/lib/actions/admin";

type Props = {
  bookingId: string;
  className: string;
  priceDollars: string;
};

export default function RefundBookingButton({
  bookingId,
  className,
  priceDollars,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRefund() {
    setLoading(true);
    const result = await refundBooking(bookingId);

    if (result.error) {
      toast.error("Refund failed", { description: result.error });
    } else {
      toast.success("Refund issued. Customer will receive an email.");
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50">
          <DollarSign className="mr-2 h-4 w-4" />
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue manual refund?</DialogTitle>
          <DialogDescription>
            This will refund {priceDollars} for <strong>{className}</strong> to the
            customer&apos;s original payment method. An email will be sent notifying
            them. Use for service recovery or other exceptions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
