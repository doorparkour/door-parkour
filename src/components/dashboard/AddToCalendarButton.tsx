"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  title: string;
  startsAt: string;
  durationMins: number;
  location: string;
  description?: string | null;
};

const TZ = "America/Chicago";

function formatGoogleDate(d: Date): string {
  const y = d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).replace(/-/g, "");
  const t = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).replace(/:/g, "");
  return `${y}T${t}`;
}

function formatICSDate(d: Date): string {
  const y = d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).replace(/-/g, "");
  const t = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).replace(/:/g, "");
  return `${y}T${t}`;
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildGoogleCalendarUrl(
  title: string,
  start: Date,
  end: Date,
  location: string,
  description?: string | null
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    ctz: TZ,
    location,
  });
  if (description?.trim()) params.set("details", description.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildICS(
  title: string,
  start: Date,
  end: Date,
  location: string,
  description?: string | null
): string {
  const uid = `door-parkour-${start.getTime()}@doorparkour.com`;
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Door Parkour//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${TZ}:${formatICSDate(start)}`,
    `DTEND;TZID=${TZ}:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `LOCATION:${escapeICS(location)}`,
  ];
  if (description?.trim()) lines.push(`DESCRIPTION:${escapeICS(description.trim())}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(ics: string, filename: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AddToCalendarButton({
  title,
  startsAt,
  durationMins,
  location,
  description,
}: Props) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);

  const googleUrl = buildGoogleCalendarUrl(title, start, end, location, description);
  const ics = buildICS(title, start, end, location, description);
  const safeTitle = title.replace(/[^a-z0-9]/gi, "-").slice(0, 40);
  const filename = `${safeTitle}.ics`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadICS(ics, filename)}
        >
          Download .ics (Apple, Outlook, etc.)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
