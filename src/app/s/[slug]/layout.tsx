import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/server";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  return tenant
    ? {
        title: { absolute: `${tenant.name} — احجزي موعدك` },
        description: tenant.about ?? `احجزي موعدك في ${tenant.name} أونلاين.`,
      }
    : {};
}

export default async function TenantLayout({ children, params }: Props) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const brand = (tenant.brand ?? {}) as Record<string, string>;
  const base = `/s/${slug}`;
  const vars = {
    "--brand": brand.primary ?? "#b76e79",
    "--brand-deep": "color-mix(in srgb, var(--brand) 76%, #1a1010)",
    "--ink": brand.accent ?? "#2b2422",
    "--paper": brand.bg ?? "#f8f4f1",
  } as React.CSSProperties;

  return (
    <div style={vars} className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href={base} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl btn-brand text-base font-bold">
              {tenant.name.slice(0, 1)}
            </span>
            <span className="font-display text-lg font-bold">{tenant.name}</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link
              href={`${base}/account`}
              className="rounded-full px-4 py-2 transition hover:bg-ink/5"
            >
              حسابي
            </Link>
            <Link href={`${base}/book`} className="btn-brand rounded-full px-5 py-2.5">
              احجزي الآن
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-auto border-t border-line bg-surface/40">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl btn-brand text-sm font-bold">
                {tenant.name.slice(0, 1)}
              </span>
              <span className="font-display text-base font-bold">{tenant.name}</span>
            </span>
            <span className="flex flex-wrap items-center gap-5 opacity-70">
              {tenant.city && <span>{tenant.city}</span>}
              {tenant.phone && <span dir="ltr">{tenant.phone}</span>}
              <Link href={`${base}/book`} className="font-bold text-brand hover:underline">
                احجزي موعدك
              </Link>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs opacity-50">
            <Link href={`${base}/admin`} className="hover:text-brand">
              دخول الإدارة
            </Link>
            <span>
              مُشغّل بواسطة <b className="font-display">Spa &amp; Salon Pro</b>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
