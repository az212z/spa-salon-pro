import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Database } from "./database.types";

// عميل خادم بمفتاح anon — مكونات الخادم تقرأ البيانات العامة فقط (RLS يتكفل بالباقي)
export function supabaseServer() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

// مخزَّنة لكل طلب — layout والصفحة يستدعيانها دون استعلام مكرر
export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  const { data } = await supabaseServer()
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});
