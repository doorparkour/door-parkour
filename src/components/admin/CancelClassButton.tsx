"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CancelClassButtonProps {
  action: () => Promise<void>;
  title: string;
  bookedCount: number;
}

export default function CancelClassButton({
  action,
  title,
  bookedCount,
}: CancelClassButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await action();
        toast.success(`"${title}" cancelled`, {
          description:
            bookedCount > 0
              ? `${bookedCount} participant${bookedCount !== 1 ? "s" : ""} notified and refunded.`
              : undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        toast.error("Failed to cancel class", { description: message });
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Ban className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="text-left">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>Cancel &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground text-left">
              {bookedCount > 0 ? (
                <>
                  This class has{" "}
                  <strong>
                    {bookedCount} active booking{bookedCount !== 1 ? "s" : ""}
                  </strong>
                  . Cancelling will:
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Cancel all bookings</li>
                    <li>Issue automatic Stripe refunds</li>
                    <li>Send a cancellation email to each participant</li>
                  </ul>
                </>
              ) : (
                "This class has no active bookings. It will be marked as cancelled."
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            variant="destructive"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel Class
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
