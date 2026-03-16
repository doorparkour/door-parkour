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
import { Loader2, Check } from "lucide-react";
import { approveOrderRefund } from "@/lib/actions/admin";

type Props = {
  requestId: string;
};

export default function ApproveOrderRefundButton({ requestId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveOrderRefund(requestId);

    if (result.error) {
      toast.error("Approve failed", { description: result.error });
    } else {
      toast.success("Refund approved. Customer will receive an email.");
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
          className="text-green-700 border-green-200 hover:bg-green-50"
        >
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve refund request?</DialogTitle>
          <DialogDescription>
            This will issue a full refund to the customer&apos;s original payment
            method and send them a confirmation email.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
