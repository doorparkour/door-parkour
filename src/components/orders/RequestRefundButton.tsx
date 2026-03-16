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
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { requestOrderRefund } from "@/lib/actions/orders";
import ReturnPolicyModal from "./ReturnPolicyModal";

type Props = {
  orderId: string;
  returnPolicyAgreedAt: string | null;
};

export default function RequestRefundButton({
  orderId,
  returnPolicyAgreedAt,
}: Props) {
  const router = useRouter();
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (returnPolicyAgreedAt) {
      setConfirmOpen(true);
    } else {
      setPolicyModalOpen(true);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    const result = await requestOrderRefund(orderId);

    if (result.error) {
      toast.error("Refund request failed", { description: result.error });
    } else {
      toast.success("Refund request submitted. An admin will review it shortly.");
      setConfirmOpen(false);
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request refund?</DialogTitle>
            <DialogDescription>
              This will submit a refund request for admin review. You will
              receive an email once your request is processed.
            </DialogDescription>
          </DialogHeader>
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

      <ReturnPolicyModal
        orderId={orderId}
        open={policyModalOpen}
        onOpenChange={setPolicyModalOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
