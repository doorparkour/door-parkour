import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import CancelClassButton from "@/components/admin/CancelClassButton";
import ClassParticipantsSheet from "@/components/admin/ClassParticipantsSheet";
import { cancelClass } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Admin — Classes" };

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = status === "cancelled" ? "cancelled" : "active";

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("is_cancelled", activeTab === "cancelled")
    .order("starts_at", { ascending: false });

  // Fetch active bookings with participant and customer info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("class_id, participant_name, user_id")
    .in("status", ["confirmed", "waitlist"]);

  const userIds = [...new Set((bookings ?? []).map((b) => b.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  const participantsByClass = (bookings ?? []).reduce<
    Record<string, Array<{ participant_name: string | null; customer_name: string | null }>>
  >((acc, b) => {
    if (!acc[b.class_id]) acc[b.class_id] = [];
    acc[b.class_id].push({
      participant_name: b.participant_name,
      customer_name: profileMap[b.user_id] ?? null,
    });
    return acc;
  }, {});

  const countByClass = (bookings ?? []).reduce<Record<string, number>>(
    (acc, b) => {
      acc[b.class_id] = (acc[b.class_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dp-teal">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all classes, including unpublished drafts.
          </p>
        </div>
        <Button asChild className="bg-dp-orange text-white hover:bg-dp-orange-dark">
          <Link href="/admin/classes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Class
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Link
          href="/admin/classes"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "bg-dp-teal text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
        </Link>
        <Link
          href="/admin/classes?status=cancelled"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "cancelled"
              ? "bg-dp-teal text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Cancelled
        </Link>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        {!classes?.length ? (
          <p className="p-6 text-sm text-muted-foreground">
            {activeTab === "cancelled" ? "No cancelled classes." : "No classes yet."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spots</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Booked</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {classes.map((cls) => {
                const bookedCount = countByClass[cls.id] ?? 0;
                return (
                  <tr
                    key={cls.id}
                    className={`hover:bg-muted/20 transition-colors ${cls.is_cancelled ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">{cls.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Chicago",
                      }).format(new Date(cls.starts_at))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cls.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cls.spots_remaining}/{cls.capacity}
                    </td>
                    <td className="px-4 py-3">
                      <ClassParticipantsSheet
                        classTitle={cls.title}
                        classDate={new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Chicago",
                        }).format(new Date(cls.starts_at))}
                        participants={participantsByClass[cls.id] ?? []}
                        bookedCount={bookedCount}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {cls.is_cancelled ? (
                        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800 dark:hover:bg-red-900/40">
                          Cancelled
                        </Badge>
                      ) : (
                        <Badge variant={cls.is_published ? "default" : "secondary"}>
                          {cls.is_published ? "Published" : "Draft"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!cls.is_cancelled && (
                          <>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/classes/${cls.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <CancelClassButton
                              title={cls.title}
                              bookedCount={bookedCount}
                              action={cancelClass.bind(null, cls.id)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
