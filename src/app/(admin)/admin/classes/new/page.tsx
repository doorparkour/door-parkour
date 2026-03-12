import type { Metadata } from "next";
import { createClass } from "@/lib/actions/admin";
import ClassForm from "@/components/admin/ClassForm";

export const metadata: Metadata = { title: "Admin — New Class" };

export default function NewClassPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">New Class</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new class. Set it as a draft until you&apos;re ready to publish.
        </p>
      </div>
      <ClassForm action={createClass} />
    </div>
  );
}
