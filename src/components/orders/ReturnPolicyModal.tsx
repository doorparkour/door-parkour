"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AgreementScrollForm from "@/components/waiver/AgreementScrollForm";
import {
  RETURN_POLICY_TITLE,
  RETURN_POLICY_CONTENT,
} from "@/lib/return-policy/content";
import { requestOrderRefund } from "@/lib/actions/orders";

type Props = {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function ReturnPolicyModal({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  async function handleSubmit() {
    const agreeRes = await fetch("/api/return-policy/agree", { method: "POST" });

    if (agreeRes.status === 401) {
      toast.error("Please log in to continue.");
      return;
    }

    const agreeData = await agreeRes.json();
    if (!agreeRes.ok) {
      toast.error("Failed to record agreement", {
        description: agreeData.error ?? "Please try again.",
      });
      throw new Error(agreeData.error);
    }

    const result = await requestOrderRefund(orderId);

    if (result.error) {
      toast.error("Refund request failed", { description: result.error });
      throw new Error(result.error);
    }

    toast.success("Refund request submitted. An admin will review it shortly.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{RETURN_POLICY_TITLE}</DialogTitle>
        </DialogHeader>
        <AgreementScrollForm
          title={RETURN_POLICY_TITLE}
          content={RETURN_POLICY_CONTENT}
          agreeLabel="I have read and agree to the return policy above."
          submitLabel="I Agree & Request Refund"
          onSubmit={handleSubmit}
          scrollHint="Scroll to the bottom to continue."
          asChild
        />
      </DialogContent>
    </Dialog>
  );
}
