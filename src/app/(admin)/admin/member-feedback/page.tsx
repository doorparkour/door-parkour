import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin — Member feedback" };

export default async function AdminMemberFeedbackPage() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("member_feedback")
    .select("id, user_id, message, consent_testimonial, created_at")
    .order("consent_testimonial", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/member-feedback]", error.message);
  }

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, display_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null; display_name: string | null }[] };

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [
      p.id,
      p.display_name?.trim() || p.full_name?.trim() || "—",
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Member feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time reviews from students who completed a class. Rows with marketing consent are listed first.
        </p>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        {!rows?.length ? (
          <p className="p-6 text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Consent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Chicago",
                      }).format(new Date(row.created_at))}
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      <span className="break-words">{profileMap[row.user_id] ?? row.user_id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {row.consent_testimonial ? (
                        <Badge className="bg-dp-teal/15 text-dp-teal border-dp-teal/30">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <p className="whitespace-pre-wrap break-words max-w-xl">{row.message}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
