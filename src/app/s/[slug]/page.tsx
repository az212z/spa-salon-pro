import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant, supabaseServer } from "@/lib/server";
import { fmtDuration, fmtPrice } from "@/lib/format";

export default async function SalonHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const sb = supabaseServer();
  const [{ data: services }, { data: staff }, { data: reviews }, { data: packages }] =
    await Promise.all([
      sb
        .from("services")
        .select("id, name, description, duration_minutes, price, categories(name)")
        .eq("tenant_id", tenant.id)
        .order("sort"),
      sb
        .from("staff")
        .select("id, name, title")
        .eq("tenant_id", tenant.id)
        .order("created_at"),
      sb
        .from("reviews")
        .select("rating, comment")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(6),
      sb
        .from("packages")
        .select("id, name, description, price, sessions_count")
        .eq("tenant_id", tenant.id),
    ]);

  const base = `/s/${slug}`;
  const byCategory = new Map<string, NonNullable<typeof services>>();
  for (const s of services ?? []) {
    const cat = s.categories?.name ?? "خدمات أخرى";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(s);
  }

  const ratingCount = reviews?.length ?? 0;
  const ratingAvg =
    ratingCount > 0
      ? (reviews!.reduce((s, r) => s + r.rating, 0) / ratingCount).toFixed(1)
      : null;

  return (
    <main>
      {/* ===== البطل ===== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-20">
          <div className="rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-sm font-bold text-brand">
              {tenant.city ? `${tenant.city} · ` : ""}صالون وسبا نسائي
            </p>
            <h1 className="mb-5 font-display text-5xl font-bold leading-[1.12] md:text-6xl">
              {tenant.name}
            </h1>
            {tenant.about && (
              <p className="mb-7 max-w-md text-lg leading-relaxed opacity-70">
                {tenant.about}
              </p>
            )}
            <div className="mb-7 flex flex-wrap gap-3">
              <Link
                href={`${base}/book`}
                className="btn-brand rounded-full px-8 py-3.5 text-base font-bold"
              >
                احجزي موعدك
              </Link>
              <a
                href="#services"
                className="rounded-full border border-line bg-surface/60 px-8 py-3.5 text-base font-bold transition hover:border-brand hover:text-brand"
              >
                تصفّحي الخدمات
              </a>
            </div>
            {ratingAvg && (
              <p className="flex items-center gap-2 text-sm">
                <span className="text-gold">
                  {"★".repeat(Math.round(Number(ratingAvg)))}
                </span>
                <b>{ratingAvg}</b>
                <span className="opacity-60">من {ratingCount} تقييم</span>
              </p>
            )}
          </div>

          <div className="rise rise-2 card-lux p-8 md:p-9">
            <p className="mb-1 font-display text-lg font-bold">لماذا تحجزين أونلاين؟</p>
            <div className="rule-gold mb-6 mt-3" />
            <ul className="grid gap-5 text-[15px] leading-relaxed">
              <li className="flex gap-3">
                <span className="text-xl">⏱</span>
                <span>ترين الأوقات المتاحة فعلًا — بلا مكالمات ولا انتظار</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">💆‍♀️</span>
                <span>تختارين موظفتكِ المفضّلة أو أي متاحة</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔔</span>
                <span>تذكير تلقائي قبل موعدكِ على واتساب</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">⭐</span>
                <span>نقاط ولاء على كل زيارة تتحوّل لمكافآت</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== الخدمات ===== */}
      <section id="services" className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12">
            <div className="rule-gold mb-4" />
            <h2 className="font-display text-4xl font-bold">خدماتنا</h2>
          </div>
          <div className="grid gap-12">
            {[...byCategory.entries()].map(([cat, items]) => (
              <div key={cat}>
                <h3 className="mb-4 text-sm font-bold tracking-widest text-brand">{cat}</h3>
                <ul className="grid gap-2">
                  {items.map((s) => (
                    <li
                      key={s.id}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-surface/50 px-5 py-4 transition hover:border-line hover:shadow-[var(--shadow-soft)]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">{s.name}</p>
                        {s.description && (
                          <p className="mt-0.5 truncate text-sm opacity-60">
                            {s.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden text-sm opacity-55 sm:block">
                          {fmtDuration(s.duration_minutes)}
                        </span>
                        <span className="font-display font-bold">{fmtPrice(s.price)}</span>
                        <Link
                          href={`${base}/book?service=${s.id}`}
                          className="rounded-full border border-brand px-4 py-1.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
                        >
                          حجز
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {byCategory.size === 0 && (
              <p className="opacity-55">سيتم إضافة الخدمات قريبًا.</p>
            )}
          </div>
        </div>
      </section>

      {/* ===== الفريق ===== */}
      {(staff ?? []).length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12">
            <div className="rule-gold mb-4" />
            <h2 className="font-display text-4xl font-bold">فريقنا</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {staff!.map((m) => (
              <div
                key={m.id}
                className="card-lux card-lux-hover flex flex-col items-center gap-3 px-6 py-7 text-center"
              >
                <span className="grid size-16 place-items-center rounded-full bg-brand/12 font-display text-2xl font-bold text-brand">
                  {m.name.slice(0, 1)}
                </span>
                <div>
                  <p className="font-bold">{m.name}</p>
                  {m.title && <p className="text-sm opacity-60">{m.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== الباقات ===== */}
      {(packages ?? []).length > 0 && (
        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <div className="mb-12">
              <div className="rule-gold mb-4" />
              <h2 className="font-display text-4xl font-bold">باقات موفّرة</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages!.map((p) => (
                <div key={p.id} className="card-lux card-lux-hover flex flex-col p-7">
                  <p className="mb-1 font-bold">{p.name}</p>
                  <p className="mb-5 text-sm opacity-60">
                    {p.description ?? `${p.sessions_count} جلسات`}
                  </p>
                  <p className="mt-auto font-display text-3xl font-bold text-gradient">
                    {fmtPrice(p.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== التقييمات ===== */}
      {(reviews ?? []).length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12">
            <div className="rule-gold mb-4" />
            <h2 className="font-display text-4xl font-bold">آراء عميلاتنا</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews!.map((r, i) => (
              <figure key={i} className="card-lux p-7">
                <p className="mb-3 text-gold" aria-label={`${r.rating} من 5`}>
                  {"★".repeat(r.rating)}
                  <span className="opacity-20">{"★".repeat(5 - r.rating)}</span>
                </p>
                {r.comment && (
                  <blockquote className="text-[15px] leading-relaxed opacity-80">
                    “{r.comment}”
                  </blockquote>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ===== دعوة أخيرة ===== */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-24 text-center">
          <div className="rule-gold" />
          <h2 className="font-display text-4xl font-bold md:text-5xl">جاهزة لإطلالة جديدة؟</h2>
          <p className="max-w-md opacity-65">
            احجزي موعدكِ في أقل من دقيقة، واختاري الوقت الذي يناسبكِ.
          </p>
          <Link href={`${base}/book`} className="btn-brand rounded-full px-10 py-4 text-lg font-bold">
            احجزي موعدكِ الآن
          </Link>
        </div>
      </section>
    </main>
  );
}
