import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  WAIVER_TITLE,
  WAIVER_CONTENT,
  WAIVER_SIGNATURE_PLACEHOLDER,
} from "@/lib/waiver/content";
import { generateWaiverPdf } from "@/lib/waiver/pdf";

const WAIVER_STORAGE_PATH = (userId: string) => `${userId}/waiver.pdf`;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const signedAt = new Date().toISOString();
  const displayName = profile?.full_name?.trim() || "Participant";
  const signatureBlock = `Signed by: ${displayName}\nDate: ${new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(signedAt))}`;
  const content = WAIVER_CONTENT.replace(
    WAIVER_SIGNATURE_PLACEHOLDER,
    signatureBlock
  );

  const pdfBytes = await generateWaiverPdf(WAIVER_TITLE, content);
  const path = WAIVER_STORAGE_PATH(user.id);

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("waivers")
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[waiver/sign] PDF upload failed:", uploadError);
    return NextResponse.json(
      { error: "Failed to save waiver copy" },
      { status: 500 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      waiver_signed_at: signedAt,
      waiver_pdf_path: path,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  revalidatePath("/waiver");
  revalidatePath("/waiver/view");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/classes");

  return NextResponse.json({ success: true });
}
