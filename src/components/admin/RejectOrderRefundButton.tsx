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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { rejectOrderRefund } from "@/lib/actions/admin";
import {
  REJECTION_REASON_OPTIONS,
  REJECTION_REASON_OTHER,
  formatRejectionReason,
} from "@/lib/refund-rejection-reasons";

type Props = {
  requestId: string;
};

export default function RejectOrderRefundButton({ requestId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>("");
  const [otherMessage, setOtherMessage] = useState("");

  async function handleReject() {
    setLoading(true);
    const reason =
      reasonCode &&
      formatRejectionReason(
        reasonCode as "outside_refund_window" | "sale_item_excluded" | "other",
        reasonCode === REJECTION_REASON_OTHER ? otherMessage : undefined
      );
    const result = await rejectOrderRefund(requestId, reason ?? undefined);

    if (result.error) {
      toast.error("Reject failed", { description: result.error });
    } else {
      toast.success("Request rejected. Customer will receive an email.");
      setOpen(false);
      setReasonCode("");
      setOtherMessage("");
      router.refresh();
    }
    setLoading(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReasonCode("");
      setOtherMessage("");
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-200 hover:bg-red-50"
        >
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject refund request?</DialogTitle>
          <DialogDescription>
            The customer will receive an email notifying them of the rejection.
            You can optionally select a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASON_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reasonCode === REJECTION_REASON_OTHER && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">Reason (required)</Label>
              <Input
                id="other-reason"
                placeholder="Explain the reason for the rejection"
                value={otherMessage}
                onChange={(e) => setOtherMessage(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={
              loading ||
              (reasonCode === REJECTION_REASON_OTHER && !otherMessage.trim())
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
