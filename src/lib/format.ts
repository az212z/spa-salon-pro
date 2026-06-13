// أدوات عرض عربية — أرقام لاتينية مع نصوص عربية (أوضح للأسعار والأوقات)
const NUM = "ar-SA-u-nu-latn";

export function fmtPrice(n: number | string) {
  return `${Number(n).toLocaleString(NUM)} ر.س`;
}

export function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} دقيقة`;
  const hs = h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${h} ساعات`;
  return m === 0 ? hs : `${hs} و${m} د`;
}

export function fmtTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat(NUM, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

export function fmtDateLong(d: Date | string, tz: string) {
  return new Intl.DateTimeFormat(NUM, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  }).format(typeof d === "string" ? new Date(d) : d);
}

// مفتاح اليوم YYYY-MM-DD بتوقيت الصالون — يُمرر لدالة الأوقات المتاحة
export function dateKey(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}

export function nextDays(tz: string, count = 14) {
  const out: { key: string; date: Date }[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() + i * 86_400_000);
    out.push({ key: dateKey(date, tz), date });
  }
  return out;
}

// 05XXXXXXXX أو ٠٥... أو 9665... → ‎+9665XXXXXXXX
export function normalizePhone(raw: string): string | null {
  const western = raw.replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
  const digits = western.replace(/[^0-9+]/g, "").replace(/^\+/, "");
  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("05") && n.length === 10) n = `966${n.slice(1)}`;
  if (n.startsWith("5") && n.length === 9) n = `966${n}`;
  if (!/^[0-9]{8,15}$/.test(n)) return null;
  return `+${n}`;
}

export const TIER_LABEL: Record<string, string> = {
  bronze: "برونزي",
  silver: "فضي",
  gold: "ذهبي",
  vip: "VIP",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  in_progress: "جارٍ التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم تحضر",
};
