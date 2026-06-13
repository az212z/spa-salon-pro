"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/context";
import { Card, inputCls, btnCls } from "@/components/admin/ui";
import { normalizePhone } from "@/lib/format";

type Settings = {
  name: string;
  about: string;
  phone: string;
  whatsapp_number: string;
  city: string;
};

export default function SettingsPage() {
  const { tenantId, role } = useAdmin();
  const sb = supabaseBrowser();
  const [f, setF] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = role === "owner"; // سياسة قاعدة البيانات: المالكة فقط تعدّل بيانات الصالون

  const load = useCallback(async () => {
    const { data } = await sb
      .from("tenants")
      .select("name, about, phone, whatsapp_number, city")
      .eq("id", tenantId)
      .single();
    if (data)
      setF({
        name: data.name ?? "",
        about: data.about ?? "",
        phone: data.phone ?? "",
        whatsapp_number: data.whatsapp_number ?? "",
        city: data.city ?? "",
      });
  }, [sb, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!f) return;
    if (!f.name.trim()) return setMsg("اسم الصالون مطلوب");
    const phone = f.phone.trim() ? normalizePhone(f.phone) : null;
    if (f.phone.trim() && !phone) return setMsg("رقم الهاتف غير صحيح");
    const whatsapp = f.whatsapp_number.trim() ? normalizePhone(f.whatsapp_number) : null;
    if (f.whatsapp_number.trim() && !whatsapp) return setMsg("رقم الواتساب غير صحيح");
    setBusy(true);
    setMsg("");
    const { error } = await sb
      .from("tenants")
      .update({
        name: f.name.trim(),
        about: f.about.trim() || null,
        phone,
        whatsapp_number: whatsapp,
        city: f.city.trim() || null,
      })
      .eq("id", tenantId);
    setBusy(false);
    setMsg(error ? "تعذر الحفظ" : "تم الحفظ ✓");
    if (!error) load();
  }

  if (!f) return <main className="py-10 text-center text-sm opacity-50">لحظة…</main>;

  return (
    <main>
      <h1 className="mb-4 font-display text-2xl font-bold">الإعدادات</h1>
      <Card title="بيانات الصالون">
        <div className="grid max-w-md gap-3 text-sm">
          {!canEdit && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
              التعديل متاح للمالكة فقط — تقدرين الاطلاع.
            </p>
          )}
          <label className="grid gap-1">
            <span className="text-xs opacity-60">اسم الصالون</span>
            <input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-60">نبذة — تظهر في صفحة الصالون</span>
            <textarea
              value={f.about}
              onChange={(e) => setF({ ...f, about: e.target.value })}
              disabled={!canEdit}
              rows={3}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-xs opacity-60">الهاتف</span>
              <input
                dir="ltr"
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
                disabled={!canEdit}
                placeholder="05XXXXXXXX"
                className={`${inputCls} text-left`}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-60">واتساب</span>
              <input
                dir="ltr"
                value={f.whatsapp_number}
                onChange={(e) => setF({ ...f, whatsapp_number: e.target.value })}
                disabled={!canEdit}
                placeholder="05XXXXXXXX"
                className={`${inputCls} text-left`}
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-xs opacity-60">المدينة</span>
            <input
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
            />
          </label>
          {msg && (
            <p className={`font-bold ${msg.includes("✓") ? "text-emerald-700" : "text-red-600"}`}>
              {msg}
            </p>
          )}
          {canEdit && (
            <button onClick={save} disabled={busy} className={btnCls}>
              {busy ? "جارٍ الحفظ…" : "حفظ"}
            </button>
          )}
        </div>
      </Card>
    </main>
  );
}
