"use client";

export const inputCls =
  "rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
export const btnCls =
  "btn-brand rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40 disabled:pointer-events-none";
export const ghostCls =
  "rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm font-bold transition hover:border-brand hover:text-brand disabled:opacity-40";

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card-lux p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-display text-lg font-bold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm hover:bg-ink/5">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  confirmed: "bg-brand/15 text-brand border-brand/40",
  in_progress: "bg-blue-100 text-blue-900 border-blue-300",
  completed: "bg-emerald-100 text-emerald-900 border-emerald-300",
  cancelled: "bg-ink/5 opacity-60 border-line",
  no_show: "bg-red-100 text-red-900 border-red-300",
};

// الانتقالات المتاحة لكل حالة — مطابقة لحارس قاعدة البيانات
export const NEXT_STATUS: Record<string, { to: string; label: string }[]> = {
  pending: [
    { to: "confirmed", label: "تأكيد" },
    { to: "cancelled", label: "إلغاء" },
  ],
  confirmed: [
    { to: "in_progress", label: "بدء الخدمة" },
    { to: "completed", label: "إكمال" },
    { to: "no_show", label: "لم تحضر" },
    { to: "cancelled", label: "إلغاء" },
  ],
  in_progress: [
    { to: "completed", label: "إكمال" },
    { to: "cancelled", label: "إلغاء" },
  ],
};
