"use client";

import { useParams, useRouter } from "next/navigation";
import OtpLogin from "@/components/otp-login";

export default function LoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-grid size-14 place-items-center rounded-2xl btn-brand text-2xl">
          🌸
        </span>
        <h1 className="mb-2 font-display text-3xl font-bold">تسجيل الدخول</h1>
        <p className="opacity-60">ادخلي لمتابعة حجوزاتكِ ونقاطكِ وهداياكِ.</p>
      </div>
      <div className="card-lux p-6">
        <OtpLogin onDone={() => router.replace(`/s/${slug}/account`)} />
      </div>
    </main>
  );
}
