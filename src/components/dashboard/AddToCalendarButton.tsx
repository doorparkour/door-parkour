"use client";

import { AddToCalendarButton } from "add-to-calendar-button-react";

type Props = {
  title: string;
  startsAt: string;
  durationMins: number;
  location: string;
};

export default function AddToCalendarButtonWrapper({
  title,
  startsAt,
  durationMins,
  location,
}: Props) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <AddToCalendarButton
      name={title}
      options={["Apple", "Google", "Outlook.com", "Yahoo"]}
      location={location}
      startDate={formatDate(start)}
      endDate={formatDate(end)}
      startTime={formatTime(start)}
      endTime={formatTime(end)}
      timeZone="America/Chicago"
      buttonStyle="default"
      size="5"
    />
  );
}
