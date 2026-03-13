import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteClass } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Admin — Classes" };

export default async function AdminClassesPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .order("starts_at", { ascending: false });

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

      <div className="rounded-lg border bg-white overflow-hidden">
        {!classes?.length ? (
          <p className="p-6 text-sm text-muted-foreground">No classes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spots</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-muted/20 transition-colors">
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
                    <Badge variant={cls.is_published ? "default" : "secondary"}>
                      {cls.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/classes/${cls.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        label={cls.title}
                        action={deleteClass.bind(null, cls.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
