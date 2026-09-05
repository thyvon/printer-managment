export function fmtPeriod(start: string, end?: string) {
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const from = s.toLocaleDateString("en-US", opts);
  if (!end) return from;
  const e = new Date(end);
  return `${from} – ${e.toLocaleDateString("en-US", opts)}`;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
