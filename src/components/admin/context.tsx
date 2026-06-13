"use client";

import { createContext, useContext } from "react";

export type AdminCtx = {
  tenantId: string;
  tenantName: string;
  base: string; // ‎/s/slug
  adminBase: string; // ‎/s/slug/admin
  tz: string;
  role: string; // owner | manager | receptionist
};

export const AdminContext = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin خارج AdminShell");
  return ctx;
}

// السعودية بلا توقيت صيفي — إزاحة ثابتة +03
export function dayRange(key: string) {
  return { from: `${key}T00:00:00+03:00`, to: `${addDays(key, 1)}T00:00:00+03:00` };
}

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 0=الأحد … 6=السبت (نفس ترقيم staff_schedules)
export function weekdayOf(key: string) {
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}
