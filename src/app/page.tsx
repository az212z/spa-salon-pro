import Link from "next/link";
import { supabaseServer } from "@/lib/server";

export const revalidate = 60;

const FEATURES = [
  {
    icon: "🗓",
    title: "حجوزات لحظية بلا تعارض",
    body: "تقويم ذكي يعرض الأوقات المتاحة فعلًا لكل موظفة، ويمنع حجزين على نفس الموعد على مستوى قاعدة البيانات.",
  },
  {
    icon: "💬",
    title: "تذكيرات واتساب تلقائية",
    body: "تأكيد فوري، تذكير قبل الموعد، ومتابعة بعد الزيارة — تقلّ نسبة عدم الحضور وتعود العميلة من جديد.",
  },
  {
    icon: "👑",
    title: "قاعدة عملاء وملف جمال",
    body: "شرائح ذكية، وسوم، ملاحظات داخلية، وتاريخ كامل لكل عميلة — تعرفين عميلتك قبل أن تدخل الباب.",
  },
  {
    icon: "🎁",
    title: "ولاء وهدايا وعروض",
    body: "نقاط على كل زيارة، مستويات، بطاقات هدايا، وكوبونات — أدوات نمو حقيقية مدمجة في النظام.",
  },
  {
    icon: "🌐",
    title: "هوية ورابط خاص لكل صالون",
    body: "كل صالون يحصل على صفحته بألوانه واسمه ونطاقه الفرعي — تجربة تشبه تطبيقًا خاصًا به وحده.",
  },
  {
    icon: "🔒",
    title: "عزل تام للبيانات",
    body: "بيانات كل صالون معزولة بالكامل بسياسات أمان على مستوى كل صف — لا تتسرّب معلومة بين صالون وآخر.",
  },
];

const PLANS = [
  {
    name: "الأساسية",
    price: "299",
    tag: "للبداية",
    featured: false,
    items: ["الحجوزات + التقويم", "قاعدة عملاء كاملة", "موظفتان", "تذكيرات واتساب"],
  },
  {
    name: "الاحترافية",
    price: "599",
    tag: "الأكثر طلبًا",
    featured: true,
    items: ["كل مزايا الأساسية", "موظفات بلا حد", "الولاء والهدايا", "الحملات التسويقية"],
  },
  {
    name: "المتقدمة",
    price: "999",
    tag: "للسلاسل",
    featured: false,
    items: ["كل مزايا الاحترافية", "فروع متعددة", "دومين خاص", "تقارير متقدمة"],
  },
];

export default async function PlatformHome() {
  const { data: tenants } = await supabaseServer()
    .from("tenants")
    .select("slug, name, city, about, brand")
    .order("created_at");

  return (
    <main className="overflow-hidden">
      {/* ===== الهيدر ===== */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="grid size-9 place-items-center rounded-xl btn-brand text-base">✦</span>
            Spa&nbsp;<span className="text-gradient">&amp;</span>&nbsp;Salon Pro
          </span>
          <div className="flex items-center gap-2 text-sm font-bold">
            <a href="#plans" className="hidden rounded-full px-4 py-2 transition hover:bg-ink/5 sm:block">
              الأسعار
            </a>
            <a
              href="#start"
              className="btn-brand rounded-full px-5 py-2.5"
            >
              ابدئي مجانًا
            </a>
          </div>
        </div>
      </header>

      {/* ===== البطل ===== */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <p className="rise mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-sm font-bold text-brand">
          ✦ نظام عربي متكامل للصالونات والسبا
        </p>
        <h1 className="rise rise-1 mx-auto mb-6 max-w-3xl font-display text-5xl font-bold leading-[1.15] md:text-7xl">
          أدِري صالونكِ كأنه
          <br />
          <span className="text-gradient">علامة فاخرة</span>
        </h1>
        <p className="rise rise-2 mx-auto mb-10 max-w-2xl text-lg leading-relaxed opacity-70 md:text-xl">
          حجوزات لحظية، قاعدة عملاء ذكية، تذكيرات واتساب، ونقاط ولاء — في نظام
          واحد أنيق. لكل صالون نظامه وهويته ورابطه الخاص، باشتراك ثابت بلا عمولة
          على عميلاتك.
        </p>
        <div className="rise rise-3 flex flex-wrap justify-center gap-3">
          <a href="#start" className="btn-brand rounded-full px-8 py-4 text-base font-bold">
            جرّبي 14 يومًا مجانًا
          </a>
          <a
            href="#features"
            className="rounded-full border border-line bg-surface/60 px-8 py-4 text-base font-bold transition hover:border-brand hover:text-brand"
          >
            اكتشفي المزايا
          </a>
        </div>
        <p className="rise rise-4 mt-6 text-sm opacity-55">بلا بطاقة ائتمان · جاهز خلال دقائق · دعم بالعربي</p>
      </section>

      {/* ===== شريط أرقام ===== */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px md:grid-cols-4">
          {[
            ["لحظي", "تحديث التقويم"],
            ["0٪", "عمولة على عميلاتك"],
            ["100٪", "عربي وRTL"],
            ["24/7", "حجز ذاتي للعميلات"],
          ].map(([big, small]) => (
            <div key={small} className="px-6 py-8 text-center">
              <p className="font-display text-3xl font-bold text-brand md:text-4xl">{big}</p>
              <p className="mt-1 text-sm opacity-60">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== المزايا ===== */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <div className="rule-gold mx-auto mb-5" />
          <h2 className="font-display text-4xl font-bold md:text-5xl">كل ما يحتاجه صالونكِ في مكان واحد</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-65">
            من أول حجز حتى عودة العميلة — أدوات مصمّمة لتجربة فاخرة وإدارة بلا فوضى.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-lux card-lux-hover p-7">
              <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand/10 text-2xl">
                {f.icon}
              </span>
              <h3 className="mb-2 text-lg font-extrabold">{f.title}</h3>
              <p className="text-[15px] leading-relaxed opacity-70">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== الأسعار ===== */}
      <section id="plans" className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 text-center">
            <div className="rule-gold mx-auto mb-5" />
            <h2 className="font-display text-4xl font-bold md:text-5xl">باقات بسيطة وواضحة</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-65">
              اشتراك شهري ثابت — بلا نسب على حجوزاتك. ابدئي بـ 14 يومًا مجانًا.
            </p>
          </div>
          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl border p-8 ${
                  p.featured
                    ? "border-brand bg-surface shadow-[var(--shadow-lift)] lg:-translate-y-3"
                    : "border-line bg-surface/60"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 right-8 btn-brand rounded-full px-3 py-1 text-xs font-bold">
                    {p.tag}
                  </span>
                )}
                {!p.featured && (
                  <span className="mb-1 text-xs font-bold tracking-widest text-brand opacity-80">
                    {p.tag}
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                <p className="mb-6 mt-3">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="opacity-60"> ر.س / شهريًا</span>
                </p>
                <ul className="mb-8 grid gap-3 text-[15px]">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-center gap-2.5">
                      <span className="text-brand">✓</span>
                      {it}
                    </li>
                  ))}
                </ul>
                <a
                  href="#start"
                  className={`mt-auto rounded-full py-3 text-center font-bold transition ${
                    p.featured
                      ? "btn-brand"
                      : "border border-line hover:border-brand hover:text-brand"
                  }`}
                >
                  ابدئي الآن
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== الصالونات المشتركة ===== */}
      {(tenants ?? []).length > 0 && (
        <section id="start" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 text-center">
            <div className="rule-gold mx-auto mb-5" />
            <h2 className="font-display text-4xl font-bold md:text-5xl">صالونات تثق بنا</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-65">
              ادخلي على أي صالون لتجربة تجربة العميلة الكاملة — أو جرّبي لوحة الإدارة التجريبية.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants!.map((t) => {
              const brand = (t.brand ?? {}) as Record<string, string>;
              return (
                <Link
                  key={t.slug}
                  href={`/s/${t.slug}`}
                  className="card-lux card-lux-hover group flex items-center gap-4 p-6"
                >
                  <span
                    className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-bold text-white shadow-md"
                    style={{ background: brand.primary ?? "var(--brand)" }}
                  >
                    {t.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold">{t.name}</span>
                    <span className="block text-sm opacity-60">{t.city ?? "—"}</span>
                  </span>
                  <span className="mr-auto text-brand opacity-0 transition group-hover:opacity-100">
                    ←
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== دعوة ختامية ===== */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <div className="rule-gold" />
          <h2 className="font-display text-4xl font-bold md:text-5xl">جاهزة لتنقلي صالونكِ لمستوى آخر؟</h2>
          <p className="max-w-lg opacity-65">
            انضمي إلى Spa &amp; Salon Pro اليوم، وابدئي باستقبال الحجوزات خلال دقائق.
          </p>
          <a href="#start" className="btn-brand rounded-full px-10 py-4 text-lg font-bold">
            ابدئي تجربتكِ المجانية
          </a>
        </div>
      </section>

      {/* ===== التذييل ===== */}
      <footer className="border-t border-line bg-surface/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm opacity-70 sm:flex-row">
          <span className="flex items-center gap-2 font-display font-bold">
            <span className="grid size-7 place-items-center rounded-lg btn-brand text-xs">✦</span>
            Spa &amp; Salon Pro
          </span>
          <span>© {new Date().getFullYear()} — صُنع بعناية للصالونات العربية</span>
        </div>
      </footer>
    </main>
  );
}
