"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/context";
import { Modal, inputCls, btnCls, ghostCls } from "@/components/admin/ui";
import { fmtPrice, fmtDuration } from "@/lib/format";

type Service = {
  id: string;
  category_id: string | null;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  sort: number;
  is_active: boolean;
};
type Category = { id: string; name: string };

const EMPTY = {
  id: "",
  category_id: null,
  name: "",
  duration_minutes: 60,
  buffer_minutes: 0,
  price: 0,
  sort: 0,
  is_active: true,
} satisfies Service;

export default function ServicesPage() {
  const { tenantId } = useAdmin();
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Service[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);

  const load = useCallback(async () => {
    const [sv, ct] = await Promise.all([
      sb
        .from("services")
        .select("id, category_id, name, duration_minutes, buffer_minutes, price, sort, is_active")
        .eq("tenant_id", tenantId)
        .order("sort"),
      sb.from("categories").select("id, name").eq("tenant_id", tenantId).order("sort"),
    ]);
    setRows(((sv.data as Service[]) ?? []).map((s) => ({ ...s, price: Number(s.price) })));
    setCats(ct.data ?? []);
  }, [sb, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "بدون تصنيف";

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          الخدمات <span className="text-base opacity-50">({rows.length})</span>
        </h1>
        <button onClick={() => setEditing(EMPTY)} className={btnCls}>
          + خدمة جديدة
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface/70">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm opacity-50">لا خدمات بعد — أضيفي أول خدمة.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setEditing(s)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition hover:bg-brand/5"
                >
                  <div>
                    <p className={`text-sm font-extrabold ${s.is_active ? "" : "opacity-40 line-through"}`}>
                      {s.name}
                    </p>
                    <p className="text-xs opacity-60">
                      {catName(s.category_id)} · {fmtDuration(s.duration_minutes)}
                      {s.buffer_minutes > 0 && ` + ${s.buffer_minutes} د تجهيز`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="font-bold">{fmtPrice(s.price)}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-bold ${
                        s.is_active ? "bg-emerald-100 text-emerald-900" : "bg-ink/5 opacity-60"
                      }`}
                    >
                      {s.is_active ? "نشطة" : "موقوفة"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditService
        key={editing?.id ?? "new"}
        service={editing}
        cats={cats}
        onClose={() => setEditing(null)}
        onDone={load}
      />
    </main>
  );
}

const NEW_CAT = "__new__";

function EditService({
  service,
  cats,
  onClose,
  onDone,
}: {
  service: Service | null;
  cats: Category[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { tenantId } = useAdmin();
  const [f, setF] = useState<Service>(service ?? EMPTY);
  const [newCat, setNewCat] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isNew = !f.id;

  async function save() {
    if (!f.name.trim()) return setErr("اسم الخدمة مطلوب");
    if (f.duration_minutes < 5 || f.duration_minutes > 480)
      return setErr("المدة بين 5 دقائق و8 ساعات");
    if (f.price < 0) return setErr("السعر غير صحيح");
    if (f.category_id === NEW_CAT && !newCat.trim()) return setErr("اكتبي اسم التصنيف الجديد");
    setBusy(true);
    setErr("");
    const sb = supabaseBrowser();

    let categoryId = f.category_id;
    if (categoryId === NEW_CAT) {
      const { data, error } = await sb
        .from("categories")
        .insert({ tenant_id: tenantId, name: newCat.trim(), sort: cats.length })
        .select("id")
        .single();
      if (error || !data) {
        setBusy(false);
        return setErr("تعذر إنشاء التصنيف");
      }
      categoryId = data.id;
    }

    const payload = {
      name: f.name.trim(),
      category_id: categoryId,
      duration_minutes: f.duration_minutes,
      buffer_minutes: f.buffer_minutes,
      price: f.price,
      sort: f.sort,
      is_active: f.is_active,
    };
    const { error } = isNew
      ? await sb.from("services").insert({ tenant_id: tenantId, ...payload })
      : await sb.from("services").update(payload).eq("id", f.id);
    setBusy(false);
    if (error) setErr("تعذر الحفظ");
    else {
      onClose();
      onDone();
    }
  }

  return (
    <Modal open={!!service} onClose={onClose} title={isNew ? "خدمة جديدة" : "تعديل الخدمة"}>
      <div className="grid gap-3 text-sm">
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="اسم الخدمة"
          className={inputCls}
        />
        <select
          value={f.category_id ?? ""}
          onChange={(e) => setF({ ...f, category_id: e.target.value || null })}
          className={inputCls}
        >
          <option value="">بدون تصنيف</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CAT}>+ تصنيف جديد…</option>
        </select>
        {f.category_id === NEW_CAT && (
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="اسم التصنيف الجديد"
            className={inputCls}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs opacity-60">المدة (دقائق)</span>
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={f.duration_minutes}
              onChange={(e) => setF({ ...f, duration_minutes: +e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-60">تجهيز بعدها (دقائق)</span>
            <input
              type="number"
              min={0}
              max={120}
              step={5}
              value={f.buffer_minutes}
              onChange={(e) => setF({ ...f, buffer_minutes: +e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-60">السعر (ر.س)</span>
            <input
              type="number"
              min={0}
              value={f.price}
              onChange={(e) => setF({ ...f, price: +e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-60">الترتيب</span>
            <input
              type="number"
              value={f.sort}
              onChange={(e) => setF({ ...f, sort: +e.target.value })}
              className={inputCls}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={f.is_active}
            onChange={(e) => setF({ ...f, is_active: e.target.checked })}
            className="size-4 accent-brand"
          />
          نشطة — تظهر للعميلات في صفحة الحجز
        </label>
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
