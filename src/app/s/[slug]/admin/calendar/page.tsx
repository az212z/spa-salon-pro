"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin, dayRange, addDays, weekdayOf } from "@/components/admin/context";
import { Modal, STATUS_STYLE, NEXT_STATUS, inputCls, btnCls, ghostCls } from "@/components/admin/ui";
import { fmtPrice, fmtTime, fmtDateLong, dateKey, STATUS_LABEL } from "@/lib/format";

const PX_PER_MIN = 1.1;
const SNAP_PX = 15 * PX_PER_MIN; // الإفلات على شبكة ربع ساعة
const HOURS_COL = 52; // عرض عمود الساعات
const DRAGGABLE = new Set(["pending", "confirmed"]);

type Booking = {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_amount: number;
  customers: { name: string; phone: string } | null;
  booking_items: { service_name: string }[];
};
type StaffRow = { id: string; name: string };

export default function CalendarPage() {
  const { tenantId, tz } = useAdmin();
  const sb = supabaseBrowser();
  const urlDay = useSearchParams().get("day");
  const [day, setDay] = useState(() =>
    urlDay && /^\d{4}-\d{2}-\d{2}$/.test(urlDay) ? urlDay : dateKey(new Date(), tz)
  );
  const changeDay = (d: string) => {
    setDay(d);
    window.history.replaceState(null, "", `?day=${d}`);
  };
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hours, setHours] = useState<{ start: number; end: number }>({ start: 10, end: 22 });
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const dragRef = useRef<{
    b: Booking;
    startX: number;
    startY: number;
    origIdx: number;
    colW: number;
    started: boolean;
  } | null>(null);
  // النقرة تصل بعد إفلات السحب — هذا العلم يمنعها من فتح البطاقة
  const justDragged = useRef(false);

  const load = useCallback(async () => {
    const { from, to } = dayRange(day);
    const [st, bk, sch] = await Promise.all([
      sb.from("staff").select("id, name").eq("tenant_id", tenantId).eq("is_active", true).order("created_at"),
      sb
        .from("bookings")
        .select(
          "id, staff_id, starts_at, ends_at, status, total_amount, customers(name, phone), booking_items(service_name)"
        )
        .eq("tenant_id", tenantId)
        .gte("starts_at", from)
        .lt("starts_at", to)
        .neq("status", "cancelled"),
      sb
        .from("staff_schedules")
        .select("start_time, end_time")
        .eq("tenant_id", tenantId)
        .eq("weekday", weekdayOf(day)),
    ]);
    setStaff(st.data ?? []);
    setBookings((bk.data as Booking[]) ?? []);
    const times = sch.data ?? [];
    if (times.length) {
      setHours({
        start: Math.min(...times.map((t) => +t.start_time.slice(0, 2))),
        end: Math.max(...times.map((t) => +String(t.end_time).slice(0, 2))),
      });
    } else setHours({ start: 10, end: 22 });
  }, [sb, tenantId, day]);

  useEffect(() => {
    load();
  }, [load]);

  // التقويم يتحدث لحظيًا عند أي تغيير في الحجوزات
  useEffect(() => {
    const ch = sb
      .channel(`adm-cal-${day}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `tenant_id=eq.${tenantId}` },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, tenantId, day, load]);

  const gridStart = useMemo(
    () => new Date(`${day}T${String(hours.start).padStart(2, "0")}:00:00+03:00`).getTime(),
    [day, hours.start]
  );
  const gridHeight = (hours.end - hours.start) * 60 * PX_PER_MIN;

  async function transition(b: Booking, to: string) {
    setMsg("");
    const { error } =
      to === "cancelled"
        ? await sb.rpc("cancel_booking", { p_booking: b.id, p_reason: "إلغاء من الإدارة" })
        : await sb.from("bookings").update({ status: to as never }).eq("id", b.id);
    if (error) setMsg(error.message.replace(/^.*?: /, ""));
    else {
      setSelected(null);
      load();
    }
  }

  // ============ سحب وإفلات: تغيير الوقت عموديًا والموظفة أفقيًا ============
  function dragStart(e: React.PointerEvent, b: Booking, colIdx: number) {
    if (!DRAGGABLE.has(b.status) || !gridRef.current) return;
    const colW = (gridRef.current.getBoundingClientRect().width - HOURS_COL) / staff.length;
    dragRef.current = { b, startX: e.clientX, startY: e.clientY, origIdx: colIdx, colW, started: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // المؤشر انرفع قبل الالتقاط — السحب يكمل ما دام فوق البطاقة
    }
  }

  function dragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.started && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    d.started = true;
    setDrag({ id: d.b.id, dx, dy: Math.round(dy / SNAP_PX) * SNAP_PX });
  }

  async function dragEnd(e: React.PointerEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    justDragged.current = !!d?.started;
    if (!d?.started || !gridRef.current) return;

    const dyMin = Math.round((e.clientY - d.startY) / SNAP_PX) * 15;
    // الشبكة RTL: عمود الساعات في أقصى اليمين والموظفات تتوالى يسارًا
    const rect = gridRef.current.getBoundingClientRect();
    const fromRight = rect.right - e.clientX - HOURS_COL;
    const colIdx = Math.min(staff.length - 1, Math.max(0, Math.floor(fromRight / d.colW)));

    const oldStart = new Date(d.b.starts_at).getTime();
    const dur = new Date(d.b.ends_at).getTime() - oldStart;
    const dayEnd = gridStart + (hours.end - hours.start) * 3_600_000;
    const newStart = Math.min(Math.max(oldStart + dyMin * 60_000, gridStart), dayEnd - dur);
    const newStaff = staff[colIdx]?.id ?? d.b.staff_id;
    if (newStart === oldStart && newStaff === d.b.staff_id) return;

    setMsg("");
    const { error } = await sb
      .from("bookings")
      .update({
        starts_at: new Date(newStart).toISOString(),
        ends_at: new Date(newStart + dur).toISOString(),
        staff_id: newStaff,
      })
      .eq("id", d.b.id);
    if (error)
      setMsg(
        error.code === "23P01"
          ? "الوقت يتعارض مع حجز آخر لنفس الموظفة"
          : error.message.replace(/^.*?: /, "")
      );
    load();
  }

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">التقويم</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDay(addDays(day, -1))} className={ghostCls}>
            →
          </button>
          <span className="min-w-36 text-center text-sm font-bold">
            {fmtDateLong(`${day}T12:00:00+03:00`, tz)}
          </span>
          <button onClick={() => changeDay(addDays(day, 1))} className={ghostCls}>
            ←
          </button>
          <button onClick={() => setCreating(true)} className={btnCls}>
            + حجز يدوي
          </button>
        </div>
      </div>

      {msg && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/70">
        <div
          ref={gridRef}
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `${HOURS_COL}px repeat(${staff.length}, 1fr)` }}
        >
          <div className="border-b border-line" />
          {staff.map((m) => (
            <div key={m.id} className="border-b border-s border-line px-3 py-3 text-center text-sm font-extrabold">
              {m.name}
            </div>
          ))}

          {/* عمود الساعات */}
          <div className="relative" style={{ height: gridHeight }}>
            {Array.from({ length: hours.end - hours.start }, (_, i) => (
              <span
                key={i}
                className="absolute end-1 text-[10px] opacity-40"
                style={{ top: i * 60 * PX_PER_MIN - 6 }}
              >
                {fmtTime(`${day}T${String(hours.start + i).padStart(2, "0")}:00:00+03:00`, tz)}
              </span>
            ))}
          </div>

          {staff.map((m, colIdx) => (
            <div key={m.id} className="relative border-s border-line" style={{ height: gridHeight }}>
              {Array.from({ length: hours.end - hours.start }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-line/60"
                  style={{ top: i * 60 * PX_PER_MIN }}
                />
              ))}
              {bookings
                .filter((b) => b.staff_id === m.id)
                .map((b) => {
                  const top = ((new Date(b.starts_at).getTime() - gridStart) / 60000) * PX_PER_MIN;
                  const h =
                    ((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000) *
                    PX_PER_MIN;
                  const dragging = drag?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        if (justDragged.current) {
                          justDragged.current = false;
                          return;
                        }
                        setSelected(b);
                      }}
                      onPointerDown={(e) => dragStart(e, b, colIdx)}
                      onPointerMove={dragMove}
                      onPointerUp={dragEnd}
                      onPointerCancel={() => {
                        dragRef.current = null;
                        setDrag(null);
                      }}
                      className={`absolute inset-x-1 overflow-hidden rounded-xl border px-2 py-1 text-start text-xs leading-tight hover:brightness-95 ${STATUS_STYLE[b.status]} ${
                        DRAGGABLE.has(b.status) ? "cursor-grab touch-none" : ""
                      } ${dragging ? "z-10 cursor-grabbing opacity-80 shadow-lg" : "transition"}`}
                      style={{
                        top,
                        height: Math.max(h - 2, 22),
                        transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                      }}
                    >
                      <b>{b.customers?.name ?? "—"}</b>
                      <br />
                      {b.booking_items.map((i) => i.service_name).join(" + ")}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* بطاقة الحجز */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل الحجز">
        {selected && (
          <div className="grid gap-4 text-sm">
            <div className="grid gap-1">
              <p className="text-lg font-extrabold">{selected.customers?.name}</p>
              <p dir="ltr" className="text-start opacity-60">
                {selected.customers?.phone}
              </p>
              <p className="opacity-70">
                {fmtTime(selected.starts_at, tz)} – {fmtTime(selected.ends_at, tz)} ·{" "}
                {selected.booking_items.map((i) => i.service_name).join(" + ")} ·{" "}
                <b>{fmtPrice(selected.total_amount)}</b>
              </p>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[selected.status]}`}
              >
                {STATUS_LABEL[selected.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(NEXT_STATUS[selected.status] ?? []).map((t) => (
                <button
                  key={t.to}
                  onClick={() => transition(selected, t.to)}
                  className={t.to === "cancelled" || t.to === "no_show" ? ghostCls : btnCls}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ManualBooking open={creating} onClose={() => setCreating(false)} onDone={load} day={day} />
    </main>
  );
}

// ============ الحجز اليدوي (هاتفي / حضوري) ============
function ManualBooking({
  open,
  onClose,
  onDone,
  day,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  day: string;
}) {
  const { tenantId, tz } = useAdmin();
  const sb = supabaseBrowser();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [who, setWho] = useState("");
  const [date, setDate] = useState(day);
  const [slots, setSlots] = useState<{ starts_at: string }[]>([]);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(day);
    Promise.all([
      sb.from("services").select("id, name, price").eq("tenant_id", tenantId).eq("is_active", true).order("sort"),
      sb.from("staff").select("id, name").eq("tenant_id", tenantId).eq("is_active", true),
    ]).then(([s, m]) => {
      setServices((s.data ?? []).map((x) => ({ ...x, price: Number(x.price) })));
      setStaff(m.data ?? []);
    });
  }, [open, sb, tenantId, day]);

  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      const { data } = await sb
        .from("customers")
        .select("id, name, phone")
        .eq("tenant_id", tenantId)
        .or(`name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`)
        .limit(6);
      setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, sb, tenantId]);

  async function loadSlots() {
    setErr("");
    setSlot("");
    const { data, error } = await sb.rpc("get_available_slots", {
      p_tenant: tenantId,
      p_service_ids: [...picked],
      p_date: date,
      p_staff: who,
    });
    if (error) setErr("تعذر تحميل الأوقات");
    else setSlots(data ?? []);
  }

  async function create() {
    if (!customer || !who || !slot || picked.size === 0) return;
    setBusy(true);
    setErr("");
    const { error } = await sb.rpc("create_booking", {
      p_tenant: tenantId,
      p_staff: who,
      p_service_ids: [...picked],
      p_starts_at: slot,
      p_customer: customer.id,
      p_source: "phone",
    });
    setBusy(false);
    if (error) setErr(error.message.replace(/^.*?: /, ""));
    else {
      onClose();
      onDone();
      setCustomer(null);
      setPicked(new Set());
      setSlot("");
      setQ("");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="حجز يدوي">
      <div className="grid gap-4 text-sm">
        {/* العميلة */}
        {customer ? (
          <p className="flex items-center justify-between rounded-xl bg-brand/10 px-4 py-3 font-bold">
            {customer.name}
            <button onClick={() => setCustomer(null)} className="text-xs opacity-60">
              تغيير
            </button>
          </p>
        ) : (
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحثي بالاسم أو الجوال…"
              className={`${inputCls} w-full`}
            />
            {results.length > 0 && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCustomer(r);
                      setResults([]);
                    }}
                    className="flex w-full justify-between px-4 py-2.5 hover:bg-brand/5"
                  >
                    <b>{r.name}</b>
                    <span dir="ltr" className="opacity-60">
                      {r.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* الخدمات */}
        <div className="flex flex-wrap gap-2">
          {services.map((s) => {
            const on = picked.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => {
                  const n = new Set(picked);
                  if (on) n.delete(s.id);
                  else n.add(s.id);
                  setPicked(n);
                  setSlots([]);
                  setSlot("");
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
                  on ? "border-brand bg-brand text-white" : "border-line"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {/* الموظفة واليوم */}
        <div className="grid grid-cols-2 gap-2">
          <select value={who} onChange={(e) => { setWho(e.target.value); setSlots([]); }} className={inputCls}>
            <option value="">الموظفة…</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSlots([]); }}
            className={inputCls}
          />
        </div>

        <button
          onClick={loadSlots}
          disabled={!who || picked.size === 0}
          className={ghostCls}
        >
          عرض الأوقات المتاحة
        </button>

        {slots.length > 0 && (
          <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto">
            {slots.map((s) => (
              <button
                key={s.starts_at}
                onClick={() => setSlot(s.starts_at)}
                className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                  slot === s.starts_at ? "border-brand bg-brand text-white" : "border-line"
                }`}
              >
                {fmtTime(s.starts_at, tz)}
              </button>
            ))}
          </div>
        )}

        {err && <p className="font-bold text-red-600">{err}</p>}

        <button onClick={create} disabled={busy || !customer || !slot} className={btnCls}>
          {busy ? "جارٍ الحجز…" : "إنشاء الحجز"}
        </button>
      </div>
    </Modal>
  );
}
