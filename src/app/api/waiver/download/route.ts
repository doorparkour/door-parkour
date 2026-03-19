import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("waiver_pdf_path")
    .eq("id", user.id)
    .single();

  if (!profile?.waiver_pdf_path) {
    return NextResponse.json(
      { error: "No signed waiver on file" },
      { status: 404 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("waivers")
    .download(profile.waiver_pdf_path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to retrieve waiver" },
      { status: 500 }
    );
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="door-parkour-waiver.pdf"',
    },
  });
}
