"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/context";
import { Modal, inputCls, btnCls, ghostCls } from "@/components/admin/ui";
import { fmtPrice, normalizePhone, TIER_LABEL } from "@/lib/format";

type Seg = {
  id: string;
  name: string;
  phone: string;
  tier: string;
  segment: string;
  visits_count: number;
  total_spent: number;
  points_balance: number;
  last_visit_at: string | null;
};

const SEG_LABEL: Record<string, string> = {
  new: "جديدة",
  active: "نشطة",
  at_risk: "معرضة للفقدان",
  lost: "مفقودة",
};
const SEG_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-900",
  active: "bg-emerald-100 text-emerald-900",
  at_risk: "bg-amber-100 text-amber-900",
  lost: "bg-red-100 text-red-900",
};

export default function CustomersPage() {
  const { tenantId, adminBase } = useAdmin();
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Seg[]>([]);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("");
  const [adding, setAdding] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    let query = sb
      .from("customer_segments")
      .select("id, name, phone, tier, segment, visits_count, total_spent, points_balance, last_visit_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (q.trim().length >= 2)
      query = query.or(`name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`);
    if (seg) query = query.eq("segment", seg);
    const { data } = await query;
    setRows((data as Seg[]) ?? []);
  }, [sb, tenantId, q, seg]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // تصدير كل العميلات (لا يتأثر بالبحث أو حد العرض)
  async function exportCsv() {
    const { data } = await sb
      .from("customer_segments")
      .select("name, phone, tier, segment, visits_count, total_spent, points_balance, last_visit_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["الاسم", "الجوال", "المستوى", "الشريحة", "الزيارات", "إجمالي الصرف", "النقاط", "آخر زيارة"];
    const lines = (data ?? []).map((c) =>
      [
        c.name,
        c.phone,
        TIER_LABEL[c.tier ?? ""] ?? c.tier ?? "",
        SEG_LABEL[c.segment ?? ""] ?? c.segment ?? "",
        c.visits_count,
        c.total_spent,
        c.points_balance,
        c.last_visit_at?.slice(0, 10) ?? "",
      ]
        .map(esc)
        .join(",")
    );
    // ‏BOM ليفتح إكسل الملف بالعربية مباشرة
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `العميلات-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // استيراد: عمودان مطلوبان (الاسم، الجوال) وثالث اختياري (تاريخ الميلاد)
  async function importCsv(file: File) {
    setImportMsg("جارٍ الاستيراد…");
    const text = (await file.text()).replace(/^﻿/, "");
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
      .filter((c) => c.length >= 2 && c[0]);
    // تخطي سطر العناوين إن وجد
    const body = rows[0] && !normalizePhone(rows[0][1] ?? "") ? rows.slice(1) : rows;
    let ok = 0,
      bad = 0,
      dup = 0;
    for (const cols of body) {
      const phone = normalizePhone(cols[1] ?? "");
      if (!cols[0] || !phone) {
        bad++;
        continue;
      }
      const birth = /^\d{4}-\d{2}-\d{2}$/.test(cols[2] ?? "") ? cols[2] : null;
      const { error } = await sb.from("customers").insert({
        tenant_id: tenantId,
        name: cols[0],
        phone,
        birth_date: birth,
        source: "imported",
      });
      if (!error) ok++;
      else if (error.code === "23505") dup++;
      else bad++;
    }
    setImportMsg(`تم استيراد ${ok} · مكررة ${dup} · مرفوضة ${bad}`);
    load();
  }

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          العملاء <span className="text-base opacity-50">({rows.length})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          <button onClick={() => fileRef.current?.click()} className={ghostCls}>
            استيراد CSV
          </button>
          <button onClick={exportCsv} className={ghostCls}>
            تصدير CSV
          </button>
          <button onClick={() => setAdding(true)} className={btnCls}>
            + عميلة جديدة
          </button>
        </div>
      </div>
      {importMsg && (
        <p className="mb-3 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand">
          {importMsg}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم أو الجوال…"
          className={`${inputCls} flex-1 min-w-48`}
        />
        <select value={seg} onChange={(e) => setSeg(e.target.value)} className={inputCls}>
          <option value="">كل الشرائح</option>
          {Object.entries(SEG_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface/70">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm opacity-50">لا نتائج.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`${adminBase}/customers/${c.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-brand/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/15 font-extrabold text-brand">
                      {c.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">
                        {c.name}
                        <span className="ms-2 rounded-full bg-ink/5 px-2 py-0.5 text-[10px]">
                          {TIER_LABEL[c.tier]}
                        </span>
                      </p>
                      <p dir="ltr" className="text-start text-xs opacity-60">
                        {c.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-xs">
                    <span className="hidden sm:block opacity-60">{c.visits_count} زيارة</span>
                    <span className="hidden font-bold sm:block">{fmtPrice(c.total_spent)}</span>
                    <span className={`rounded-full px-2.5 py-1 font-bold ${SEG_STYLE[c.segment]}`}>
                      {SEG_LABEL[c.segment]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddCustomer open={adding} onClose={() => setAdding(false)} onDone={load} />
    </main>
  );
}

function AddCustomer({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { tenantId } = useAdmin();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const p = normalizePhone(phone);
    if (!name.trim()) return setErr("الاسم مطلوب");
    if (!p) return setErr("رقم الجوال غير صحيح");
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().from("customers").insert({
      tenant_id: tenantId,
      name: name.trim(),
      phone: p,
      birth_date: birth || null,
      source: "manual",
    });
    setBusy(false);
    if (error)
      setErr(error.code === "23505" ? "رقم الجوال مسجل مسبقًا" : "تعذر الحفظ");
    else {
      onClose();
      onDone();
      setName("");
      setPhone("");
      setBirth("");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="عميلة جديدة">
      <div className="grid gap-3 text-sm">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className={inputCls} />
        <input
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05XXXXXXXX"
          className={`${inputCls} text-left`}
        />
        <label className="grid gap-1">
          <span className="text-xs opacity-60">تاريخ الميلاد (اختياري — لتهنئة عيد الميلاد)</span>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className={inputCls} />
        </label>
        {err && <p className="font-bold text-red-600">{err}</p>}
        <button onClick={save} disabled={busy} className={btnCls}>
          {busy ? "جارٍ الحفظ…" : "حفظ"}
        </button>
      </div>
    </Modal>
  );
}
