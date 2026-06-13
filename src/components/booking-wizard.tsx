"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { getMyCustomer, createMyCustomer, type Customer } from "@/lib/customer";
import {
  fmtPrice,
  fmtDuration,
  fmtTime,
  fmtDateLong,
  nextDays,
  normalizePhone,
} from "@/lib/format";
import OtpLogin from "./otp-login";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
};
type Staff = { id: string; name: string; title: string | null };
type Slot = { staff_id: string; starts_at: string; ends_at: string };

const ANY = "any";

export default function BookingWizard(props: {
  tenantId: string;
  base: string;
  tz: string;
  services: Service[];
  staff: Staff[];
  links: { staff_id: string; service_id: string }[];
  preselect?: string; // معرفات خدمات مفصولة بفواصل — لإعادة الحجز أو رابط خدمة
  preStaff?: string;
}) {
  const { tenantId, base, tz, services, staff, links, preselect, preStaff } = props;

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(
    () =>
      new Set(
        (preselect ?? "")
          .split(",")
          .filter((id) => services.some((s) => s.id === id))
      )
  );
  const [who, setWho] = useState<string>(
    preStaff && staff.some((m) => m.id === preStaff) ? preStaff : ANY
  );
  const [day, setDay] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [chosen, setChosen] = useState<{ startsAt: string; staffId: string } | null>(null);
  const [error, setError] = useState("");

  // المصادقة وملف العميلة (الخطوة الأخيرة)
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);

  const pickedList = useMemo(
    () => services.filter((s) => picked.has(s.id)),
    [services, picked]
  );
  const total = pickedList.reduce((a, s) => a + s.price, 0);
  const minutes = pickedList.reduce((a, s) => a + s.duration, 0);

  // الموظفات اللواتي يقدمن كل الخدمات المختارة
  const eligible = useMemo(() => {
    if (picked.size === 0) return staff;
    const byStaff = new Map<string, Set<string>>();
    for (const l of links) {
      if (!byStaff.has(l.staff_id)) byStaff.set(l.staff_id, new Set());
      byStaff.get(l.staff_id)!.add(l.service_id);
    }
    return staff.filter((m) => {
      const set = byStaff.get(m.id);
      return set && [...picked].every((id) => set.has(id));
    });
  }, [staff, links, picked]);

  const days = useMemo(() => nextDays(tz), [tz]);

  const loadSlots = useCallback(
    async (d: string, w: string) => {
      setLoadingSlots(true);
      setSlots(null);
      setChosen(null);
      const { data, error } = await supabaseBrowser().rpc("get_available_slots", {
        p_tenant: tenantId,
        p_service_ids: [...picked],
        p_date: d,
        ...(w !== ANY ? { p_staff: w } : {}),
      });
      setLoadingSlots(false);
      if (error) setError("تعذر تحميل الأوقات — حاولي مجددًا");
      else setSlots(data ?? []);
    },
    [tenantId, picked]
  );

  useEffect(() => {
    if (step === 2 && day) loadSlots(day, who);
  }, [step, day, who, loadSlots]);

  // أوقات فريدة مع مرشحات كل وقت (لخيار «أي موظفة»)
  const times = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, string[]>();
    for (const s of slots) {
      if (!map.has(s.starts_at)) map.set(s.starts_at, []);
      map.get(s.starts_at)!.push(s.staff_id);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([t, ids]) => ({ startsAt: t, staffIds: ids }));
  }, [slots]);

  async function enterConfirm() {
    setStep(3);
    const { data } = await supabaseBrowser().auth.getSession();
    setAuthed(!!data.session);
    if (data.session) setCustomer(await getMyCustomer(tenantId));
  }

  async function afterLogin() {
    setAuthed(true);
    setCustomer(await getMyCustomer(tenantId));
  }

  async function saveProfile() {
    const p = normalizePhone(phone);
    if (!name.trim()) return setError("اكتبي اسمك");
    if (!p) return setError("رقم الجوال غير صحيح — مثال: 05XXXXXXXX");
    setBusy(true);
    setError("");
    try {
      setCustomer(await createMyCustomer(tenantId, name.trim(), p));
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    }
    setBusy(false);
  }

  async function confirm() {
    if (!chosen) return;
    setBusy(true);
    setError("");
    const { data, error } = await supabaseBrowser().rpc("create_booking", {
      p_tenant: tenantId,
      p_staff: chosen.staffId,
      p_service_ids: [...picked],
      p_starts_at: chosen.startsAt,
    });
    setBusy(false);
    if (error) {
      setError(error.message.replace(/^.*?: /, ""));
      // الوقت ربما حُجز للتو — حدّثي القائمة
      if (day) loadSlots(day, who);
      setStep(2);
    } else {
      setDone({ id: data as string });
      setStep(4);
    }
  }

  const staffName = (id: string) => staff.find((m) => m.id === id)?.name ?? "";

  if (step === 4 && done && chosen) {
    return (
      <div className="card-lux p-8 text-center rise">
        <p className="mb-3 text-5xl">🎉</p>
        <h2 className="mb-2 font-display text-2xl font-bold">تم تأكيد حجزكِ</h2>
        <p className="mb-6 opacity-70">
          {fmtDateLong(chosen.startsAt, tz)} · الساعة {fmtTime(chosen.startsAt, tz)} مع{" "}
          {staffName(chosen.staffId)}
        </p>
        <div className="mx-auto mb-8 max-w-sm divide-y divide-line rounded-2xl border border-line bg-surface px-5 text-right">
          {pickedList.map((s) => (
            <div key={s.id} className="flex justify-between py-3 text-sm">
              <span>{s.name}</span>
              <span className="font-bold">{fmtPrice(s.price)}</span>
            </div>
          ))}
          <div className="flex justify-between py-3 font-extrabold">
            <span>الإجمالي</span>
            <span className="font-display text-brand">{fmtPrice(total)}</span>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Link href={`${base}/account`} className="btn-brand rounded-full px-6 py-3 font-bold">
            حجوزاتي
          </Link>
          <Link
            href={base}
            className="rounded-full border border-line bg-surface/60 px-6 py-3 font-bold transition hover:border-brand"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* مؤشر الخطوات */}
      <ol className="mb-8 flex gap-2">
        {["الخدمات", "الموظفة", "الموعد", "التأكيد"].map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-full px-1 py-2 text-center text-xs font-bold transition sm:text-sm ${
              i === step
                ? "btn-brand"
                : i < step
                  ? "bg-brand/15 text-brand"
                  : "bg-ink/5 opacity-50"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {/* 1: الخدمات */}
      {step === 0 && (
        <div className="grid gap-2">
          {services.map((s) => {
            const on = picked.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => {
                  const next = new Set(picked);
                  if (on) next.delete(s.id);
                  else next.add(s.id);
                  setPicked(next);
                  setChosen(null);
                }}
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-right transition ${
                  on ? "border-brand bg-brand/10" : "border-line bg-surface/50 hover:border-brand/50"
                }`}
              >
                <span>
                  <span className="block font-bold">{s.name}</span>
                  <span className="block text-sm opacity-60">
                    {s.category} · {fmtDuration(s.duration)}
                  </span>
                </span>
                <span className="font-bold">{fmtPrice(s.price)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2: الموظفة */}
      {step === 1 && (
        <div className="grid gap-2">
          <button
            onClick={() => setWho(ANY)}
            className={`rounded-2xl border px-5 py-4 text-right font-bold transition ${
              who === ANY ? "border-brand bg-brand/10" : "border-line bg-surface/50 hover:border-brand/50"
            }`}
          >
            ✨ أي موظفة متاحة
            <span className="block text-sm font-normal opacity-60">
              أوقات أكثر — نختار لك من المتاحات
            </span>
          </button>
          {eligible.map((m) => (
            <button
              key={m.id}
              onClick={() => setWho(m.id)}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-right transition ${
                who === m.id ? "border-brand bg-brand/10" : "border-line bg-surface/50 hover:border-brand/50"
              }`}
            >
              <span className="grid size-11 place-items-center rounded-full bg-brand/15 font-extrabold text-brand">
                {m.name.slice(0, 1)}
              </span>
              <span>
                <span className="block font-bold">{m.name}</span>
                {m.title && <span className="block text-sm opacity-60">{m.title}</span>}
              </span>
            </button>
          ))}
          {eligible.length === 0 && (
            <p className="rounded-xl bg-ink/5 px-4 py-3 text-sm">
              لا توجد موظفة واحدة تقدم كل الخدمات المختارة — قسّمي الحجز أو غيّري الاختيار.
            </p>
          )}
        </div>
      )}

      {/* 3: اليوم والوقت */}
      {step === 2 && (
        <div>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => setDay(d.key)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-center text-sm transition ${
                  day === d.key ? "border-transparent btn-brand" : "border-line bg-surface/50 hover:border-brand/50"
                }`}
              >
                <span className="block font-bold">
                  {new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
                    weekday: "short",
                    timeZone: tz,
                  }).format(d.date)}
                </span>
                <span className="block opacity-80">
                  {new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
                    day: "numeric",
                    month: "short",
                    timeZone: tz,
                  }).format(d.date)}
                </span>
              </button>
            ))}
          </div>

          {!day && <p className="text-sm opacity-60">اختاري اليوم لعرض الأوقات المتاحة.</p>}
          {loadingSlots && <p className="text-sm opacity-60">جارٍ تحميل الأوقات…</p>}
          {day && !loadingSlots && slots && times.length === 0 && (
            <p className="rounded-xl bg-ink/5 px-4 py-3 text-sm">
              لا توجد مواعيد متاحة في هذا اليوم — جربي يومًا آخر.
            </p>
          )}
          {!loadingSlots && times.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {times.map((t) => {
                const on = chosen?.startsAt === t.startsAt;
                return (
                  <button
                    key={t.startsAt}
                    onClick={() =>
                      setChosen({
                        startsAt: t.startsAt,
                        staffId:
                          who !== ANY
                            ? who
                            : t.staffIds[Math.floor(Math.random() * t.staffIds.length)],
                      })
                    }
                    className={`rounded-xl border px-3 py-3 font-bold transition ${
                      on ? "border-transparent btn-brand" : "border-line bg-surface/50 hover:border-brand"
                    }`}
                  >
                    {fmtTime(t.startsAt, tz)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4: التأكيد */}
      {step === 3 && chosen && (
        <div className="grid gap-5">
          <div className="card-lux divide-y divide-line px-6">
            {pickedList.map((s) => (
              <div key={s.id} className="flex justify-between py-3.5 text-sm">
                <span>{s.name}</span>
                <span className="font-bold">{fmtPrice(s.price)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3.5 text-sm">
              <span className="opacity-70">الموظفة</span>
              <span className="font-bold">{staffName(chosen.staffId)}</span>
            </div>
            <div className="flex justify-between py-3.5 text-sm">
              <span className="opacity-70">الموعد</span>
              <span className="font-bold">
                {fmtDateLong(chosen.startsAt, tz)} · {fmtTime(chosen.startsAt, tz)}
              </span>
            </div>
            <div className="flex justify-between py-3.5 font-extrabold">
              <span>الإجمالي</span>
              <span className="font-display text-lg text-brand">{fmtPrice(total)}</span>
            </div>
          </div>

          {authed === null && <p className="text-sm opacity-60">لحظة…</p>}

          {authed === false && (
            <div className="card-lux p-6">
              <h3 className="mb-4 font-display text-lg font-bold">سجّلي الدخول لإتمام الحجز</h3>
              <OtpLogin onDone={afterLogin} />
            </div>
          )}

          {authed && !customer && (
            <div className="card-lux grid gap-3 p-6">
              <h3 className="font-display text-lg font-bold">أهلًا بكِ 🌸 عرّفينا عليكِ</h3>
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
                {busy ? "لحظة…" : "حفظ ومتابعة"}
              </button>
            </div>
          )}

          {authed && customer && (
            <button
              onClick={confirm}
              disabled={busy}
              className="btn-brand rounded-2xl px-6 py-4 text-lg font-extrabold disabled:opacity-40 disabled:pointer-events-none"
            >
              {busy ? "جارٍ الحجز…" : `تأكيد الحجز · ${fmtPrice(total)}`}
            </button>
          )}
        </div>
      )}

      {/* شريط التنقل السفلي */}
      {step < 3 && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-2xl border border-line bg-surface/95 px-5 py-4 shadow-[var(--shadow-lift)] backdrop-blur">
          <div className="text-sm">
            {picked.size > 0 ? (
              <>
                <b>{picked.size}</b> خدمة · {fmtDuration(minutes)} ·{" "}
                <b className="text-brand">{fmtPrice(total)}</b>
              </>
            ) : (
              <span className="opacity-50">اختاري خدمة أو أكثر</span>
            )}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-full border border-line bg-surface/60 px-5 py-2.5 font-bold transition hover:border-brand"
              >
                رجوع
              </button>
            )}
            <button
              onClick={() => (step === 2 ? enterConfirm() : setStep(step + 1))}
              disabled={
                (step === 0 && picked.size === 0) ||
                (step === 1 && who !== ANY && !eligible.some((m) => m.id === who)) ||
                (step === 2 && !chosen)
              }
              className="btn-brand rounded-full px-6 py-2.5 font-bold disabled:opacity-40 disabled:pointer-events-none"
            >
              متابعة
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <button onClick={() => setStep(2)} className="mt-6 text-sm opacity-60 hover:opacity-100">
          → تغيير الموعد
        </button>
      )}
    </div>
  );
}
