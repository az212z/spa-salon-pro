"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

// دخول برمز يصل على البريد — OTP عبر واتساب يُربط في مرحلة الواتساب
export default function OtpLogin({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError("تعذر إرسال الرمز — تأكدي من البريد");
    else setStage("code");
  }

  async function verify() {
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError("الرمز غير صحيح أو منتهي");
    else onDone();
  }

  return (
    <div className="grid gap-3">
      {stage === "email" ? (
        <>
          <label className="text-sm font-bold">البريد الإلكتروني</label>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-left outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            onClick={sendCode}
            disabled={busy || !email.includes("@")}
            className="btn-brand rounded-xl px-5 py-3 font-bold disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "جارٍ الإرسال…" : "أرسلي رمز الدخول"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm opacity-70">
            أرسلنا رمزًا من 6 أرقام إلى <b dir="ltr">{email}</b>
          </p>
          <input
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-center text-xl tracking-[0.5em] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            onClick={verify}
            disabled={busy || code.trim().length < 6}
            className="btn-brand rounded-xl px-5 py-3 font-bold disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "جارٍ التحقق…" : "دخول"}
          </button>
          <button
            onClick={() => setStage("email")}
            className="text-sm opacity-60 hover:opacity-100"
          >
            تغيير البريد
          </button>
        </>
      )}
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
