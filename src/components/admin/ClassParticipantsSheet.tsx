"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Users } from "lucide-react";

export type ParticipantRow = {
  participant_name: string | null;
  customer_name: string | null;
};

type Props = {
  classTitle: string;
  classDate: string;
  participants: ParticipantRow[];
  bookedCount: number;
};

export default function ClassParticipantsSheet({
  classTitle,
  classDate,
  participants,
  bookedCount,
}: Props) {
  const [open, setOpen] = useState(false);

  const displayName = (p: ParticipantRow) =>
    p.participant_name?.trim() || p.customer_name || "—";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">{bookedCount}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Participants</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {classTitle} · {classDate}
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-auto px-4">
          {participants.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No participants yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>Participant</span>
                <span>Customer</span>
              </div>
              <ul className="space-y-2 py-4">
                {participants.map((p, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[1fr_auto] gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{displayName(p)}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.customer_name ?? "—"}
                  </span>
                </li>
              ))}
              </ul>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
