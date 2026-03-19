"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function WaiverPrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Print or Save as PDF
    </Button>
  );
}
