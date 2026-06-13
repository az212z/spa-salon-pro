import { notFound } from "next/navigation";
import { getTenant, supabaseServer } from "@/lib/server";
import AdminShell from "@/components/admin/shell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const { data: info } = await supabaseServer()
    .from("tenant_public_info")
    .select("timezone")
    .eq("slug", slug)
    .maybeSingle();

  return (
    <AdminShell
      tenantId={tenant.id}
      tenantName={tenant.name}
      base={`/s/${slug}`}
      tz={info?.timezone ?? "Asia/Riyadh"}
    >
      {children}
    </AdminShell>
  );
}
