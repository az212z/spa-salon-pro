"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import OtpLogin from "@/components/otp-login";
import { AdminContext, type AdminCtx } from "./context";

const NAV = [
  { path: "", label: "لوحة اليوم", icon: "📊" },
  { path: "/calendar", label: "التقويم", icon: "🗓" },
  { path: "/customers", label: "العملاء", icon: "👥" },
  { path: "/services", label: "الخدمات", icon: "💅" },
  { path: "/staff", label: "الموظفات", icon: "🧕" },
  { path: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function AdminShell({
  tenantId,
  tenantName,
  base,
  tz,
  children,
}: {
  tenantId: string;
  tenantName: string;
  base: string;
  tz: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<"loading" | "login" | "denied" | "ok">("loading");
  const [role, setRole] = useState("");
  const pathname = usePathname();
  const adminBase = `${base}/admin`;

  const check = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: sess } = await sb.auth.getSession();
    if (!sess.session) return setState("login");
    const { data } = await sb
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", sess.session.user.id)
      .maybeSingle();
    if (!data) return setState("denied");
    setRole(data.role);
    setState("ok");
  }, [tenantId]);

  useEffect(() => {
    check();
  }, [check]);

  if (state === "loading")
    return (
      <main className="grid min-h-[60dvh] place-items-center px-5">
        <span className="flex items-center gap-3 opacity-60">
          <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          لحظة…
        </span>
      </main>
    );

  if (state === "login")
    return (
      <main className="mx-auto max-w-md px-5 py-20">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-grid size-14 place-items-center rounded-2xl btn-brand text-2xl">
            ✦
          </span>
          <h1 className="mb-2 font-display text-3xl font-bold">إدارة {tenantName}</h1>
          <p className="opacity-60">لوحة تحكّم خاصة بفريق الصالون.</p>
        </div>
        <div className="card-lux p-6">
          <OtpLogin onDone={check} />
        </div>
      </main>
    );

  if (state === "denied")
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="mb-3 text-5xl">🔒</p>
        <h1 className="mb-2 font-display text-2xl font-bold">غير مصرّح</h1>
        <p className="mb-6 opacity-60">هذا الحساب ليس ضمن فريق {tenantName}.</p>
        <button
          onClick={async () => {
            await supabaseBrowser().auth.signOut();
            setState("login");
          }}
          className="rounded-full border border-line bg-surface/60 px-5 py-2.5 font-bold transition hover:border-brand hover:text-brand"
        >
          دخول بحساب آخر
        </button>
      </main>
    );

  const ctx: AdminCtx = { tenantId, tenantName, base, adminBase, tz, role };

  return (
    <AdminContext.Provider value={ctx}>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 card-lux p-3 sm:block">
          <p className="mb-2 px-3 pt-1 font-display text-sm font-bold">{tenantName}</p>
          <div className="mx-3 mb-2 rule-gold" />
          <nav className="grid gap-1">
            {NAV.map((n) => {
              const href = `${adminBase}${n.path}`;
              const active =
                n.path === "" ? pathname === adminBase : pathname.startsWith(href);
              return (
                <Link
                  key={n.path}
                  href={href}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                    active ? "btn-brand" : "hover:bg-ink/5"
                  }`}
                >
                  {n.icon} {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          {/* تنقل الجوال */}
          <nav className="mb-4 flex gap-2 overflow-x-auto sm:hidden">
            {NAV.map((n) => {
              const href = `${adminBase}${n.path}`;
              const active =
                n.path === "" ? pathname === adminBase : pathname.startsWith(href);
              return (
                <Link
                  key={n.path}
                  href={href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                    active ? "btn-brand" : "border border-line bg-surface/60"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </div>
    </AdminContext.Provider>
  );
}
