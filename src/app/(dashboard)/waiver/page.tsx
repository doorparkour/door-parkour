import type { Metadata } from "next";
import WaiverSignForm from "@/components/waiver/WaiverSignForm";

export const metadata: Metadata = {
  title: "Sign Waiver",
  description: "Sign the liability waiver to book Door Parkour classes.",
};

export default function WaiverPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Sign Waiver</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You must sign the liability waiver before booking a class.
        </p>
      </div>
      <WaiverSignForm />
    </div>
  );
}
