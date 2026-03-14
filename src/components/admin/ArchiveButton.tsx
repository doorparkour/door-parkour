"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArchiveButtonProps {
  action: () => Promise<void>;
  label: string;
}

export default function ArchiveButton({ action, label }: ArchiveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        toast.success(`"${label}" archived`, {
          description: "Product is hidden from the merch page.",
        });
      } catch (err) {
        toast.error(`Failed to archive ${label}`, {
          description: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-muted-foreground hover:text-foreground hover:bg-muted"
      aria-label={`Archive ${label}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
    </Button>
  );
}
