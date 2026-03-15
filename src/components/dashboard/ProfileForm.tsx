"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CircleCheck, Camera, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileFormProps {
  profile: Profile | null;
  email: string;
}

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 4;

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shirtSize, setShirtSize] = useState<string>(profile?.shirt_size ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value;

    const supabase = createClient();
    const newEmail = getValue("email")?.trim() || null;

    if (newEmail && newEmail !== email) {
      const { error: emailError } = await supabase.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        }
      );
      if (emailError) {
        toast.error("Failed to update email", { description: emailError.message });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: getValue("full_name") || null,
        display_name: getValue("display_name") || null,
        phone: getValue("phone") || null,
        date_of_birth: getValue("date_of_birth") || null,
        shirt_size: shirtSize || null,
        emergency_contact_name: getValue("emergency_contact_name") || null,
        emergency_contact_phone: getValue("emergency_contact_phone") || null,
      })
      .eq("id", profile?.id ?? "");

    if (error) {
      toast.error("Failed to update profile", { description: error.message });
    } else {
      toast.success(
        newEmail && newEmail !== email
          ? "Profile updated. Check both your old and new email addresses to confirm the change."
          : "Profile updated"
      );
      router.refresh();
    }
    setLoading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", { description: "Use JPEG, PNG, or WebP." });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("File too large", { description: `Max size is ${MAX_SIZE_MB}MB.` });
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed", { description: uploadError.message });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq("id", profile.id);
    if (updateError) {
      toast.error("Failed to update profile", { description: updateError.message });
    } else {
      toast.success("Photo updated");
      router.refresh();
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleRemoveAvatar() {
    if (!profile?.id) return;
    setUploading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to remove photo", { description: error.message });
    } else {
      toast.success("Photo removed");
      router.refresh();
    }
    setUploading(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error("Failed to delete account", { description: error });
      setDeleting(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login?deleted=1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-muted" aria-hidden />
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPEG, PNG or WebP. Max {MAX_SIZE_MB}MB.
              </p>
              {profile?.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Changing your email will send confirmation links to both your old and new addresses.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              placeholder="How you'd like to be greeted (e.g. Sam)"
            />
            <p className="text-xs text-muted-foreground">
              Used for greetings like &quot;Hey, Sam&quot;. Falls back to your first name if blank.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? ""}
                placeholder="(920) 555-0100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={profile?.date_of_birth ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shirt_size">Shirt size</Label>
              <Select value={shirtSize || "_"} onValueChange={(v) => setShirtSize(v === "_" ? "" : v)}>
                <SelectTrigger id="shirt_size">
                  <SelectValue placeholder="Select your size (used for merch)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Not set</SelectItem>
                  {SHIRT_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used to pre-select your size when buying apparel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Required for participation in classes. This person will be
            contacted in case of an emergency.
          </p>
          <Separator className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact name</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                defaultValue={profile?.emergency_contact_name ?? ""}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact phone</Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                defaultValue={profile?.emergency_contact_phone ?? ""}
                placeholder="(920) 555-0200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waiver */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Waiver</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.waiver_signed_at ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-green-600" />
              Waiver signed on{" "}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(new Date(profile.waiver_signed_at))}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t signed the waiver yet.{" "}
              <Link
                href="/waiver"
                className="font-medium text-dp-orange hover:text-dp-orange-dark"
              >
                Sign waiver
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={loading}
        className="bg-dp-orange text-white hover:bg-dp-orange-dark"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data — bookings,
            orders, and profile info. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all bookings, and
                  all orders. There is no recovery option.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </form>
  );
}
