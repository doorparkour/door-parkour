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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { requestOrderRefund } from "@/lib/actions/orders";
import RefundPolicyModal from "./RefundPolicyModal";

type Props = {
  orderId: string;
  refundPolicyAgreedAt: string | null;
};

export default function RequestRefundButton({
  orderId,
  refundPolicyAgreedAt,
}: Props) {
  const router = useRouter();
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  function handleClick() {
    if (refundPolicyAgreedAt) {
      setConfirmOpen(true);
    } else {
      setPolicyModalOpen(true);
    }
  }

  function handlePolicyAgreed() {
    router.refresh();
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    const result = await requestOrderRefund(orderId, feedback || undefined);

    if (result.error) {
      toast.error("Refund request failed", { description: result.error });
    } else {
      toast.success("Refund request submitted.", {
        description: "If approved, you'll receive a refund — no return required.",
      });
      setConfirmOpen(false);
      setFeedback("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-amber-700 border-amber-200 hover:bg-amber-50"
        onClick={handleClick}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Request Refund
      </Button>

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setFeedback(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request refund?</DialogTitle>
            <DialogDescription>
              This will submit a refund request for admin review. You will
              receive an email once your request is processed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Anything you&apos;d like to share?{" "}
              <span className="text-muted-foreground font-normal">(optional — helps us improve our merch)</span>
            </Label>
            <Textarea
              id="feedback"
              placeholder="e.g. Wrong size, changed mind, quality concern..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-dp-orange text-white hover:bg-dp-orange-dark"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RefundPolicyModal
        open={policyModalOpen}
        onOpenChange={setPolicyModalOpen}
        onSuccess={handlePolicyAgreed}
      />
    </>
  );
}
