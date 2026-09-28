const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹74,700 — Indian digit grouping. */
export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `₹${inr.format(Math.round(amount))}`;
}

/** ₹75k, ₹1.5L — for tight spaces like chips and slider labels. */
export function formatINRCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return `₹${Math.round(amount)}`;
}

/** 1.42 → "1h 25m" */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** 15.30°N 74.12°E */
export function formatCoordinates(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lng).toFixed(2)}°${ew}`;
}

/** Local wall-clock time for an IANA timezone, e.g. "18:42". */
export function formatLocalTime(timezone: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(date);
  } catch {
    return "";
  }
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
