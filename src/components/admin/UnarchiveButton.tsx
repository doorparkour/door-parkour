"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UnarchiveButtonProps {
  action: () => Promise<void>;
  label: string;
}

export default function UnarchiveButton({ action, label }: UnarchiveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        toast.success(`"${label}" unarchived`, {
          description: "Product is now active and visible on the merch page.",
        });
      } catch (err) {
        toast.error(`Failed to unarchive ${label}`, {
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
      className="text-dp-teal hover:text-dp-teal hover:bg-dp-teal/10"
      aria-label={`Unarchive ${label}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArchiveRestore className="h-4 w-4" />
      )}
    </Button>
  );
}
