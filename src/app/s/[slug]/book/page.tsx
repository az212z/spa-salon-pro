import { notFound } from "next/navigation";
import { getTenant, supabaseServer } from "@/lib/server";
import BookingWizard from "@/components/booking-wizard";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; services?: string; staff?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const sb = supabaseServer();
  const [{ data: services }, { data: staff }, { data: links }, { data: info }] =
    await Promise.all([
      sb
        .from("services")
        .select("id, name, price, duration_minutes, categories(name)")
        .eq("tenant_id", tenant.id)
        .order("sort"),
      sb
        .from("staff")
        .select("id, name, title")
        .eq("tenant_id", tenant.id),
      sb
        .from("staff_services")
        .select("staff_id, service_id")
        .eq("tenant_id", tenant.id),
      sb
        .from("tenant_public_info")
        .select("timezone")
        .eq("slug", slug)
        .maybeSingle(),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8">
        <div className="rule-gold mb-4" />
        <h1 className="mb-1 font-display text-4xl font-bold">احجزي موعدكِ</h1>
        <p className="opacity-60">أربع خطوات بسيطة، وينتهي كل شيء 🌸</p>
      </div>
      <BookingWizard
        tenantId={tenant.id}
        base={`/s/${slug}`}
        tz={info?.timezone ?? "Asia/Riyadh"}
        services={(services ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          duration: s.duration_minutes,
          category: s.categories?.name ?? "أخرى",
        }))}
        staff={staff ?? []}
        links={links ?? []}
        preselect={sp.services ?? sp.service}
        preStaff={sp.staff}
      />
    </main>
  );
}
