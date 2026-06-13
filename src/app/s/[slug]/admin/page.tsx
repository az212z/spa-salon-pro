"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin, dayRange, addDays } from "@/components/admin/context";
import { Card, STATUS_STYLE } from "@/components/admin/ui";
import { fmtPrice, fmtTime, dateKey, STATUS_LABEL } from "@/lib/format";

type Row = {
  id: string;
  starts_at: string;
  status: string;
  total_amount: number;
  customers: { name: string } | null;
  staff: { name: string } | null;
  booking_items: { service_name: string }[];
};

export default function AdminDashboard() {
  const { tenantId, adminBase, tz } = useAdmin();
  const sb = supabaseBrowser();
  const [today, setToday] = useState<Row[]>([]);
  const [newCustomers, setNewCustomers] = useState(0);
  const [week, setWeek] = useState<{ day: string; count: number; revenue: number }[]>([]);

  const load = useCallback(async () => {
    const todayKey = dateKey(new Date(), tz);
    const { from, to } = dayRange(todayKey);
    const weekFrom = dayRange(addDays(todayKey, -6)).from;

    const [bk, nc, wk] = await Promise.all([
      sb
        .from("bookings")
        .select(
          "id, starts_at, status, total_amount, customers(name), staff(name), booking_items(service_name)"
        )
        .eq("tenant_id", tenantId)
        .gte("starts_at", from)
        .lt("starts_at", to)
        .order("starts_at"),
      sb
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", from),
      sb
        .from("bookings")
        .select("starts_at, status, total_amount")
        .eq("tenant_id", tenantId)
        .gte("starts_at", weekFrom)
        .lt("starts_at", to)
        .neq("status", "cancelled"),
    ]);

    setToday((bk.data as Row[]) ?? []);
    setNewCustomers(nc.count ?? 0);

    const byDay = new Map<string, { count: number; revenue: number }>();
    for (let i = 6; i >= 0; i--) byDay.set(addDays(todayKey, -i), { count: 0, revenue: 0 });
    for (const b of wk.data ?? []) {
      const k = dateKey(new Date(b.starts_at), tz);
      const e = byDay.get(k);
      if (e) {
        e.count++;
        if (b.status === "completed") e.revenue += Number(b.total_amount);
      }
    }
    setWeek([...byDay.entries()].map(([day, v]) => ({ day, ...v })));
  }, [sb, tenantId, tz]);

  useEffect(() => {
    load();
  }, [load]);

  const active = today.filter((b) => b.status !== "cancelled");
  const expected = active.reduce((a, b) => a + Number(b.total_amount), 0);
  const doneRevenue = today
    .filter((b) => b.status === "completed")
    .reduce((a, b) => a + Number(b.total_amount), 0);
  const maxCount = Math.max(1, ...week.map((w) => w.count));

  return (
    <main className="grid gap-5">
      <h1 className="font-display text-2xl font-bold">لوحة اليوم</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["حجوزات اليوم", String(active.length)],
          ["إيرادات متوقعة", fmtPrice(expected)],
          ["إيرادات محققة", fmtPrice(doneRevenue)],
          ["عميلات جدد", String(newCustomers)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface/70 p-4">
            <p className="text-xs font-bold opacity-50">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-brand">{value}</p>
          </div>
        ))}
      </div>

      <Card title="آخر 7 أيام — عدد الحجوزات">
        <div className="flex h-32 items-end gap-2">
          {week.map((w) => (
            <div key={w.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold opacity-60">{w.count}</span>
              <div
                className="w-full rounded-t-lg bg-brand/70"
                style={{ height: `${Math.max(4, (w.count / maxCount) * 90)}px` }}
              />
              <span className="text-[10px] opacity-50">{w.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="حجوزات اليوم"
        action={
          <Link href={`${adminBase}/calendar`} className="text-sm font-bold text-brand">
            التقويم الكامل ←
          </Link>
        }
      >
        {today.length === 0 ? (
          <p className="py-6 text-center text-sm opacity-50">لا حجوزات اليوم بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {today.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-bold">
                    {fmtTime(b.starts_at, tz)} · {b.customers?.name ?? "—"}
                  </p>
                  <p className="opacity-60">
                    {b.booking_items.map((i) => i.service_name).join(" + ")}
                    {b.staff ? ` · ${b.staff.name}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[b.status]}`}
                >
                  {STATUS_LABEL[b.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
