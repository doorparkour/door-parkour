const CLASS_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
};

export function formatClassDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", CLASS_DATE_OPTIONS).format(
    typeof date === "string" ? new Date(date) : date
  );
}
