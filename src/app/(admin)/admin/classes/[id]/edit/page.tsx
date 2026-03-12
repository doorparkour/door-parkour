import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClass } from "@/lib/actions/admin";
import ClassForm from "@/components/admin/ClassForm";

export const metadata: Metadata = { title: "Admin — Edit Class" };

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cls } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single();

  if (!cls) notFound();

  const action = updateClass.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Edit Class</h1>
        <p className="text-sm text-muted-foreground mt-1">{cls.title}</p>
      </div>
      <ClassForm action={action} defaultValues={cls} />
    </div>
  );
}
