"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/context";
import { Modal, inputCls, btnCls, ghostCls } from "@/components/admin/ui";
import type { Json } from "@/lib/database.types";

type Staff = {
  id: string;
  name: string;
  title: string | null;
  is_bookable: boolean;
  is_active: boolean;
};
type ServiceRow = { id: string; name: string };
type Schedule = { weekday: number; start_time: string; end_time: string; breaks: Json };

const EMPTY: Staff = { id: "", name: "", title: "", is_bookable: true, is_active: true };

// 0=الأحد … 6=السبت (نفس ترقيم staff_schedules)
const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function StaffPage() {
  const { tenantId } = useAdmin();
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Staff[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [editing, setEditing] = useState<Staff | null>(null);

  const load = useCallback(async () => {
    const [st, sv] = await Promise.all([
      sb
        .from("staff")
        .select("id, name, title, is_bookable, is_active")
        .eq("tenant_id", tenantId)
        .order("created_at"),
      sb
        .from("services")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("sort"),
    ]);
    setRows((st.data as Staff[]) ?? []);
    setServices(sv.data ?? []);
  }, [sb, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          الموظفات <span className="text-base opacity-50">({rows.length})</span>
        </h1>
        <button onClick={() => setEditing(EMPTY)} className={btnCls}>
          + موظفة جديدة
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface/70">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm opacity-50">لا موظفات بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setEditing(m)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition hover:bg-brand/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/15 font-extrabold text-brand">
                      {m.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className={`text-sm font-extrabold ${m.is_active ? "" : "opacity-40 line-through"}`}>
                        {m.name}
                      </p>
                      <p className="text-xs opacity-60">{m.title || "—"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    {!m.is_bookable && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-900">
                        لا تستقبل حجوزات
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 font-bold ${
                        m.is_active ? "bg-emerald-100 text-emerald-900" : "bg-ink/5 opacity-60"
                      }`}
                    >
                      {m.is_active ? "نشطة" : "موقوفة"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditStaff
        key={editing?.id ?? "new"}
        member={editing}
        services={services}
        onClose={() => setEditing(null)}
        onDone={load}
      />
    </main>
  );
}

function EditStaff({
  member,
  services,
  onClose,
  onDone,
}: {
  member: Staff | null;
  services: ServiceRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { tenantId } = useAdmin();
  const sb = supabaseBrowser();
  const [f, setF] = useState<Staff>(member ?? EMPTY);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sched, setSched] = useState<Map<number, { start: string; end: string; breaks: Json }>>(
    new Map()
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isNew = !member?.id;

  // خدمات الموظفة وجدول دوامها — عند فتح التعديل
  useEffect(() => {
    if (!member?.id) return;
    (async () => {
      const [ss, sc] = await Promise.all([
        sb.from("staff_services").select("service_id").eq("staff_id", member.id),
        sb
          .from("staff_schedules")
          .select("weekday, start_time, end_time, breaks")
          .eq("staff_id", member.id),
      ]);
      setPicked(new Set((ss.data ?? []).map((r) => r.service_id)));
      setSched(
        new Map(
          ((sc.data as Schedule[]) ?? []).map((r) => [
            r.weekday,
            // نحتفظ بالاستراحات كما هي — الحذف وإعادة الإدراج لا يجوز أن يمسحها
            { start: r.start_time.slice(0, 5), end: String(r.end_time).slice(0, 5), breaks: r.breaks },
          ])
        )
      );
    })();
  }, [sb, member?.id]);

  function toggleService(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  function toggleDay(wd: number) {
    const next = new Map(sched);
    if (next.has(wd)) next.delete(wd);
    else next.set(wd, { start: "10:00", end: "22:00", breaks: [] });
    setSched(next);
  }

  function setDayTime(wd: number, k: "start" | "end", v: string) {
    const next = new Map(sched);
    const cur = next.get(wd);
    if (cur) next.set(wd, { ...cur, [k]: v });
    setSched(next);
  }

  async function save() {
    if (!f.name.trim()) return setErr("اسم الموظفة مطلوب");
    for (const [wd, t] of sched)
      if (t.start >= t.end) return setErr(`دوام ${WEEKDAYS[wd]}: البداية يجب أن تسبق النهاية`);
    setBusy(true);
    setErr("");

    const payload = {
      name: f.name.trim(),
      title: f.title?.trim() || null,
      is_bookable: f.is_bookable,
      is_active: f.is_active,
    };
    let staffId = f.id;
    if (isNew) {
      const { data, error } = await sb
        .from("staff")
        .insert({ tenant_id: tenantId, ...payload })
        .select("id")
        .single();
      if (error || !data) {
        setBusy(false);
        return setErr("تعذر الحفظ");
      }
      staffId = data.id;
    } else {
      const { error } = await sb.from("staff").update(payload).eq("id", staffId);
      if (error) {
        setBusy(false);
        return setErr("تعذر الحفظ");
      }
    }

    // مزامنة الخدمات وجدول الدوام: حذف ثم إدراج (أعداد صغيرة)
    await sb.from("staff_services").delete().eq("staff_id", staffId);
    if (picked.size) {
      const { error } = await sb.from("staff_services").insert(
        [...picked].map((service_id) => ({ tenant_id: tenantId, staff_id: staffId, service_id }))
      );
      if (error) {
        setBusy(false);
        return setErr("تعذر حفظ خدمات الموظفة");
      }
    }
    await sb.from("staff_schedules").delete().eq("staff_id", staffId);
    if (sched.size) {
      const { error } = await sb.from("staff_schedules").insert(
        [...sched].map(([weekday, t]) => ({
          tenant_id: tenantId,
          staff_id: staffId,
          weekday,
          start_time: t.start,
          end_time: t.end,
          breaks: t.breaks ?? [],
        }))
      );
      if (error) {
        setBusy(false);
        return setErr("تعذر حفظ جدول الدوام");
      }
    }

    setBusy(false);
    onClose();
    onDone();
  }

  return (
    <Modal open={!!member} onClose={onClose} title={isNew ? "موظفة جديدة" : `تعديل: ${member?.name}`}>
      <div className="grid gap-3 text-sm">
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="الاسم"
          className={inputCls}
        />
        <input
          value={f.title ?? ""}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="المسمى — مثال: خبيرة شعر"
          className={inputCls}
        />
        <div className="flex gap-5">
          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={f.is_bookable}
              onChange={(e) => setF({ ...f, is_bookable: e.target.checked })}
              className="size-4 accent-brand"
            />
            تستقبل حجوزات
          </label>
          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={f.is_active}
              onChange={(e) => setF({ ...f, is_active: e.target.checked })}
              className="size-4 accent-brand"
            />
            نشطة
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold opacity-60">الخدمات التي تقدمها</p>
          {services.length === 0 ? (
            <p className="text-xs opacity-50">أضيفي خدمات أولًا من صفحة الخدمات.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    picked.has(s.id) ? "bg-brand text-white" : "border border-line hover:border-brand"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold opacity-60">جدول الدوام الأسبوعي</p>
          <div className="grid gap-1.5">
            {WEEKDAYS.map((label, wd) => {
              const t = sched.get(wd);
              return (
                <div key={wd} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDay(wd)}
                    className={`w-20 shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                      t ? "bg-brand text-white" : "border border-line opacity-60 hover:opacity-100"
                    }`}
                  >
                    {label}
                  </button>
                  {t ? (
                    <>
                      <input
                        type="time"
                        value={t.start}
                        onChange={(e) => setDayTime(wd, "start", e.target.value)}
                        className={`${inputCls} py-1.5`}
                      />
                      <span className="opacity-40">إلى</span>
                      <input
                        type="time"
                        value={t.end}
                        onChange={(e) => setDayTime(wd, "end", e.target.value)}
                        className={`${inputCls} py-1.5`}
                      />
                    </>
                  ) : (
                    <span className="text-xs opacity-40">إجازة</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {err && <p className="font-bold text-red-600">{err}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className={`${btnCls} flex-1`}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
          <button onClick={onClose} className={ghostCls}>
            إلغاء
          </button>
        </div>
      </div>
    </Modal>
  );
}
