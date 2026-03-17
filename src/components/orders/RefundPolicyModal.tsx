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
  REFUND_POLICY_TITLE,
  REFUND_POLICY_CONTENT,
} from "@/lib/refund-policy/content";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function RefundPolicyModal({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  async function handleSubmit() {
    const agreeRes = await fetch("/api/refund-policy/agree", { method: "POST" });

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

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{REFUND_POLICY_TITLE}</DialogTitle>
        </DialogHeader>
        <AgreementScrollForm
          title={REFUND_POLICY_TITLE}
          content={REFUND_POLICY_CONTENT}
          agreeLabel="I have read and agree to the refund policy above."
          submitLabel="I Agree & Continue"
          onSubmit={handleSubmit}
          scrollHint="Scroll to the bottom to continue."
          asChild
        />
      </DialogContent>
    </Dialog>
  );
}
