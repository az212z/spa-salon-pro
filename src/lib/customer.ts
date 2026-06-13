"use client";

import { supabaseBrowser } from "./supabase";
import type { Database } from "./database.types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

// ملف العميلة في هذا الصالون تحديدًا (الحساب واحد، والملف لكل صالون)
export async function getMyCustomer(tenantId: string): Promise<Customer | null> {
  const sb = supabaseBrowser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb
    .from("customers")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return data;
}

export async function createMyCustomer(
  tenantId: string,
  name: string,
  phone: string
): Promise<Customer> {
  const sb = supabaseBrowser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("سجلي الدخول أولًا");
  const { data, error } = await sb
    .from("customers")
    .insert({
      tenant_id: tenantId,
      user_id: auth.user.id,
      name,
      phone,
      email: auth.user.email,
    })
    .select()
    .single();
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "رقم الجوال مسجل مسبقًا لدى الصالون — تواصلي معهم لربط حسابك"
        : "تعذر إنشاء الملف — حاولي مجددًا"
    );
  }
  return data;
}
