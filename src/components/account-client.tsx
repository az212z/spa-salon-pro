"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { getMyCustomer, createMyCustomer, type Customer } from "@/lib/customer";
import {
  fmtPrice,
  fmtTime,
  fmtDateLong,
  normalizePhone,
  TIER_LABEL,
  STATUS_LABEL,
} from "@/lib/format";
import OtpLogin from "./otp-login";

type Booking = {
  id: string;
  starts_at: string;
  status: string;
  total_amount: number;
  staff_id: string | null;
  booking_items: { service_name: string; service_id: string | null }[];
  staff: { name: string } | null;
};

const TZ = "Asia/Riyadh";
const ACTIVE = new Set(["pending", "confirmed", "in_progress"]);

export default function AccountClient({
  tenantId,
  base,
}: {
  tenantId: string;
  base: string;
}) {
  const sb = supabaseBrowser();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myRatings, setMyRatings] = useState<Map<string, number>>(new Map());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: sess } = await sb.auth.getSession();
    setAuthed(!!sess.session);
    if (!sess.session) return;
    const c = await getMyCustomer(tenantId);
    setCustomer(c);
    if (!c) return;
    const [{ data }, { data: rv }] = await Promise.all([
      sb
        .from("bookings")
        .select("id, starts_at, status, total_amount, staff_id, booking_items(service_name, service_id), staff(name)")
        .eq("customer_id", c.id)
        .order("starts_at", { ascending: false }),
      sb.from("reviews").select("booking_id, rating").eq("customer_id", c.id),
    ]);
    setBookings((data as Booking[]) ?? []);
    setMyRatings(new Map((rv ?? []).map((r) => [r.booking_id, r.rating])));
  }, [sb, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    const p = normalizePhone(phone);
    if (!name.trim()) return setMsg("اكتبي اسمك");
    if (!p) return setMsg("رقم الجوال غير صحيح — مثال: 05XXXXXXXX");
    setBusy(true);
    setMsg("");
    try {
      setCustomer(await createMyCustomer(tenantId, name.trim(), p));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "حدث خطأ");
    }
    setBusy(false);
  }

  async function cancel(id: string) {
    setBusy(true);
    setMsg("");
    const { error } = await sb.rpc("cancel_booking", {
      p_booking: id,
      p_reason: "إلغاء من العميلة",
    });
    setBusy(false);
    if (error) setMsg(error.message.replace(/^.*?: /, ""));
    else load();
  }

  if (authed === null)
    return (
      <main className="grid min-h-[60dvh] place-items-center px-5">
        <span className="flex items-center gap-3 opacity-60">
          <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          لحظة…
        </span>
      </main>
    );

  if (!authed)
    return (
      <main className="mx-auto max-w-md px-5 py-20">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-grid size-14 place-items-center rounded-2xl btn-brand text-2xl">
            🌸
          </span>
          <h1 className="mb-2 font-display text-3xl font-bold">حسابي</h1>
          <p className="opacity-60">سجّلي الدخول لعرض حجوزاتكِ ونقاطكِ.</p>
        </div>
        <div className="card-lux p-6">
          <OtpLogin onDone={load} />
        </div>
      </main>
    );

  if (!customer)
    return (
      <main className="mx-auto max-w-md px-5 py-20">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold">أهلًا بكِ 🌸</h1>
          <p className="opacity-60">عرّفينا عليكِ لنكمل ملفكِ لدى الصالون.</p>
        </div>
        <div className="card-lux grid gap-3 p-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمكِ"
            className="rounded-xl border border-line bg-surface px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <input
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XXXXXXXX"
            inputMode="tel"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-left outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            onClick={saveProfile}
            disabled={busy}
            className="btn-brand rounded-xl px-5 py-3 font-bold disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "لحظة…" : "حفظ"}
          </button>
          {msg && <p className="text-sm font-bold text-red-600">{msg}</p>}
        </div>
      </main>
    );

  const upcoming = bookings.filter(
    (b) => ACTIVE.has(b.status) && new Date(b.starts_at) > new Date()
  );
  const history = bookings.filter((b) => !upcoming.includes(b));

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">أهلًا {customer.name} 🌸</h1>
          <p className="mt-1 text-sm opacity-60" dir="ltr">
            {customer.phone}
          </p>
        </div>
        <button
          onClick={async () => {
            await sb.auth.signOut();
            setAuthed(false);
            setCustomer(null);
          }}
          className="rounded-full border border-line bg-surface/60 px-4 py-2 text-sm font-bold transition hover:border-brand hover:text-brand"
        >
          خروج
        </button>
      </div>

      {/* الملخص */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["زياراتي", String(customer.visits_count)],
          ["نقاطي", String(customer.points_balance)],
          ["مستواي", TIER_LABEL[customer.tier] ?? customer.tier],
          ["محفظتي", fmtPrice(customer.wallet_balance)],
        ].map(([label, value]) => (
          <div key={label} className="card-lux p-4 text-center">
            <p className="text-xs font-bold opacity-50">{label}</p>
            <p className="mt-1 font-display text-xl font-bold text-brand">{value}</p>
          </div>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</p>
      )}

      {/* الحجوزات القادمة */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">حجوزاتي القادمة</h2>
          <Link href={`${base}/book`} className="text-sm font-bold text-brand hover:underline">
            + حجز جديد
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm opacity-60">
            لا حجوزات قادمة — <Link href={`${base}/book`} className="font-bold text-brand">احجزي الآن</Link>
          </p>
        ) : (
          <ul className="grid gap-3">
            {upcoming.map((b) => (
              <li key={b.id} className="card-lux p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {b.booking_items.map((i) => i.service_name).join(" + ")}
                    </p>
                    <p className="mt-1 text-sm opacity-60">
                      {fmtDateLong(b.starts_at, TZ)} · {fmtTime(b.starts_at, TZ)}
                      {b.staff ? ` · مع ${b.staff.name}` : ""}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="mb-2 font-bold">{fmtPrice(b.total_amount)}</p>
                    <button
                      onClick={() => cancel(b.id)}
                      disabled={busy}
                      className="text-sm font-bold text-red-600 hover:underline disabled:opacity-40"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* السجل */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">زياراتي السابقة</h2>
          <ul className="divide-y divide-line border-y border-line">
            {history.map((b) => {
              const serviceIds = b.booking_items
                .map((i) => i.service_id)
                .filter((id): id is string => !!id);
              const rated = myRatings.get(b.id);
              return (
                <li key={b.id} className="py-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {b.booking_items.map((i) => i.service_name).join(" + ")}
                      </p>
                      <p className="opacity-60">{fmtDateLong(b.starts_at, TZ)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {b.status === "completed" && serviceIds.length > 0 && (
                        <Link
                          href={`${base}/book?services=${serviceIds.join(",")}${
                            b.staff_id ? `&staff=${b.staff_id}` : ""
                          }`}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          احجزي مثلها ↻
                        </Link>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          b.status === "completed"
                            ? "bg-brand/10 text-brand"
                            : "bg-ink/5 opacity-60"
                        }`}
                      >
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                  </div>
                  {b.status === "completed" &&
                    (rated ? (
                      <p className="mt-2 text-xs opacity-60">
                        تقييمك: <span className="text-amber-500">{"★".repeat(rated)}</span>
                        {"☆".repeat(5 - rated)}
                      </p>
                    ) : (
                      <ReviewForm
                        tenantId={tenantId}
                        customerId={customer.id}
                        bookingId={b.id}
                        onDone={load}
                      />
                    ))}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

// تقييم ما بعد الزيارة — مرة واحدة لكل حجز مكتمل، يُنشر بعد موافقة الصالون
function ReviewForm({
  tenantId,
  customerId,
  bookingId,
  onDone,
}: {
  tenantId: string;
  customerId: string;
  bookingId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!stars) return setErr("اختاري عدد النجوم");
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().from("reviews").insert({
      tenant_id: tenantId,
      customer_id: customerId,
      booking_id: bookingId,
      rating: stars,
      comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) setErr("تعذر إرسال التقييم");
    else onDone();
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-bold text-amber-600 hover:underline"
      >
        ⭐ قيّمي زيارتك
      </button>
    );

  return (
    <div className="mt-3 grid gap-2 rounded-2xl bg-ink/[0.03] p-4">
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setStars(n)}
            aria-label={`${n} نجوم`}
            className={n <= stars ? "text-amber-500" : "opacity-30"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="شاركينا رأيكِ (اختياري)"
        rows={2}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      {err && <p className="text-xs font-bold text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="btn-brand rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? "لحظة…" : "إرسال التقييم"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs font-bold opacity-60">
          إلغاء
        </button>
      </div>
    </div>
  );
}
