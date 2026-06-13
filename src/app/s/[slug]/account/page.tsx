import { notFound } from "next/navigation";
import { getTenant } from "@/lib/server";
import AccountClient from "@/components/account-client";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  return <AccountClient tenantId={tenant.id} base={`/s/${slug}`} />;
}
