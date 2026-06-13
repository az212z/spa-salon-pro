"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/context";
import { Card, Modal, STATUS_STYLE, inputCls, btnCls, ghostCls } from "@/components/admin/ui";
import { fmtPrice, fmtDateLong, fmtTime, TIER_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Customer } from "@/lib/customer";

type BookingRow = {
  id: string;
  starts_at: string;
  status: string;
  total_amount: number;
  staff: { name: string } | null;
  booking_items: { service_name: string; price: number }[];
};
type Note = { id: string; body: string; created_at: string };
type Tag = { id: string; name: string; color: string };

export default function CustomerFile() {
  const { id } = useParams<{ id: string }>();
  const { tenantId, tz } = useAdmin();
  const sb = supabaseBrowser();

  const [c, setC] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [myTags, setMyTags] = useState<Set<string>>(new Set());
  const [noteText, setNoteText] = useState("");
  const [newTag, setNewTag] = useState("");
  const [gifting, setGifting] = useState(false);
  const [editBeauty, setEditBeauty] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [cu, bk, nt, tg, lk] = await Promise.all([
      sb.from("customers").select("*").eq("id", id).maybeSingle(),
      sb
        .from("bookings")
        .select("id, starts_at, status, total_amount, staff(name), booking_items(service_name, price)")
        .eq("customer_id", id)
        .order("starts_at", { ascending: false })
        .limit(30),
      sb.from("customer_notes").select("id, body, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
      sb.from("customer_tags").select("id, name, color").eq("tenant_id", tenantId).order("name"),
      sb.from("customer_tag_links").select("tag_id").eq("customer_id", id),
    ]);
    setC(cu.data);
    setBookings((bk.data as BookingRow[]) ?? []);
    setNotes(nt.data ?? []);
    setAllTags(tg.data ?? []);
    setMyTags(new Set((lk.data ?? []).map((l) => l.tag_id)));
  }, [sb, id, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote() {
    if (!noteText.trim()) return;
    const { data: u } = await sb.auth.getUser();
    await sb.from("customer_notes").insert({
      tenant_id: tenantId,
      customer_id: id,
      author_id: u.user?.id,
      body: noteText.trim(),
    });
    setNoteText("");
    load();
  }

  async function toggleTag(tagId: string) {
    if (myTags.has(tagId))
      await sb.from("customer_tag_links").delete().eq("customer_id", id).eq("tag_id", tagId);
    else
      await sb.from("customer_tag_links").insert({ tenant_id: tenantId, customer_id: id, tag_id: tagId });
    load();
  }

  async function createTag() {
    if (!newTag.trim()) return;
    const { data, error } = await sb
      .from("customer_tags")
      .insert({ tenant_id: tenantId, name: newTag.trim() })
      .select()
      .single();
    if (!error && data) {
      await sb.from("customer_tag_links").insert({ tenant_id: tenantId, customer_id: id, tag_id: data.id });
      setNewTag("");
      load();
    }
  }

  if (!c) return <main className="py-16 text-center opacity-50">لحظة…</main>;

  const beauty = (c.beauty_profile ?? {}) as Record<string, unknown>;
  const ltv = Number(c.total_spent);
  const avg = c.visits_count > 0 ? ltv / c.visits_count : 0;

  return (
    <main className="grid gap-5">
      {/* الرأس */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/70 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-brand/15 text-2xl font-extrabold text-brand">
            {c.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="text-xl font-extrabold">
              {c.name}
              <span className="ms-2 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">
                {TIER_LABEL[c.tier]}
              </span>
            </h1>
            <p dir="ltr" className="text-start text-sm opacity-60">
              {c.phone}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${c.phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ghostCls}
          >
            واتساب
          </a>
          <button onClick={() => setGifting(true)} className={btnCls}>
            🎁 إهداء نقاط
          </button>
        </div>
      </div>

      {msg && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</p>}

      {/* الأرقام */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["الزيارات", String(c.visits_count)],
          ["إجمالي الإنفاق", fmtPrice(ltv)],
          ["متوسط الزيارة", fmtPrice(avg)],
          ["النقاط", String(c.points_balance)],
          ["لم تحضر", String(c.no_show_count)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-line bg-surface/70 p-4 text-center">
            <p className="text-xs font-bold opacity-50">{l}</p>
            <p className="mt-1 text-lg font-extrabold text-brand">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* الوسوم */}
        <Card title="الوسوم">
          <div className="flex flex-wrap items-center gap-2">
            {allTags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  myTags.has(t.id) ? "border-transparent text-white" : "border-line opacity-60"
                }`}
                style={myTags.has(t.id) ? { background: t.color } : {}}
              >
                {t.name}
              </button>
            ))}
            <span className="flex items-center gap-1">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="وسم جديد…"
                className="w-24 rounded-full border border-dashed border-line bg-transparent px-3 py-1.5 text-xs outline-none focus:border-brand"
                onKeyDown={(e) => e.key === "Enter" && createTag()}
              />
              {newTag && (
                <button onClick={createTag} className="text-xs font-bold text-brand">
                  إضافة
                </button>
              )}
            </span>
          </div>
        </Card>

        {/* ملف الجمال */}
        <Card
          title="ملف الجمال"
          action={
            <button onClick={() => setEditBeauty(true)} className="text-sm font-bold text-brand">
              تعديل
            </button>
          }
        >
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["نوع البشرة", beauty.skin_type],
              ["لون الصبغة", beauty.hair_color],
              ["الحساسيات", Array.isArray(beauty.allergies) ? beauty.allergies.join("، ") : beauty.allergies],
              ["ملاحظات", beauty.notes],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <dt className="text-xs font-bold opacity-50">{String(l)}</dt>
                <dd className="font-bold">{v ? String(v) : "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* الملاحظات الداخلية */}
      <Card title="ملاحظات داخلية (لا تراها العميلة)">
        <div className="mb-3 flex gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="أضيفي ملاحظة…"
            className={`${inputCls} flex-1`}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
          />
          <button onClick={addNote} className={btnCls}>
            حفظ
          </button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm opacity-50">لا ملاحظات بعد.</p>
        ) : (
          <ul className="grid gap-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-ink/5 px-4 py-2.5 text-sm">
                {n.body}
                <span className="ms-2 text-xs opacity-50">{fmtDateLong(n.created_at, tz)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* سجل الزيارات */}
      <Card title="سجل الزيارات">
        {bookings.length === 0 ? (
          <p className="text-sm opacity-50">لا زيارات بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-bold">
                    {b.booking_items.map((i) => i.service_name).join(" + ")}
                  </p>
                  <p className="opacity-60">
                    {fmtDateLong(b.starts_at, tz)} · {fmtTime(b.starts_at, tz)}
                    {b.staff ? ` · ${b.staff.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <b>{fmtPrice(b.total_amount)}</b>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <GiftPoints open={gifting} onClose={() => setGifting(false)} customerId={c.id} onDone={load} onErr={setMsg} />
      <BeautyEdit
        open={editBeauty}
        onClose={() => setEditBeauty(false)}
        customer={c}
        onDone={load}
      />
    </main>
  );
}

function GiftPoints({
  open,
  onClose,
  customerId,
  onDone,
  onErr,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onDone: () => void;
  onErr: (m: string) => void;
}) {
  const { tenantId } = useAdmin();
  const [points, setPoints] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function gift() {
    setBusy(true);
    const { error } = await supabaseBrowser().from("loyalty_transactions").insert({
      tenant_id: tenantId,
      customer_id: customerId,
      points: parseInt(points, 10) || 0,
      reason: "gift",
      note: note || null,
    });
    setBusy(false);
    if (error) onErr("تعذر الإهداء");
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="إهداء نقاط">
      <div className="grid gap-3 text-sm">
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className={inputCls}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="السبب (اختياري)"
          className={inputCls}
        />
        <button onClick={gift} disabled={busy || !(parseInt(points, 10) > 0)} className={btnCls}>
          إهداء
        </button>
      </div>
    </Modal>
  );
}

function BeautyEdit({
  open,
  onClose,
  customer,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  onDone: () => void;
}) {
  const b = (customer.beauty_profile ?? {}) as Record<string, unknown>;
  const [skin, setSkin] = useState(String(b.skin_type ?? ""));
  const [hair, setHair] = useState(String(b.hair_color ?? ""));
  const [allergies, setAllergies] = useState(
    Array.isArray(b.allergies) ? b.allergies.join("، ") : String(b.allergies ?? "")
  );
  const [notes, setNotes] = useState(String(b.notes ?? ""));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await supabaseBrowser()
      .from("customers")
      .update({
        beauty_profile: {
          ...b,
          skin_type: skin || null,
          hair_color: hair || null,
          allergies: allergies ? allergies.split(/[،,]/).map((s) => s.trim()).filter(Boolean) : [],
          notes: notes || null,
        },
      })
      .eq("id", customer.id);
    setBusy(false);
    onClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="ملف الجمال">
      <div className="grid gap-3 text-sm">
        <input value={skin} onChange={(e) => setSkin(e.target.value)} placeholder="نوع البشرة" className={inputCls} />
        <input value={hair} onChange={(e) => setHair(e.target.value)} placeholder="لون الصبغة المفضل" className={inputCls} />
        <input
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="الحساسيات (افصلي بفاصلة)"
          className={inputCls}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات وتفضيلات"
          rows={3}
          className={inputCls}
        />
        <button onClick={save} disabled={busy} className={btnCls}>
          حفظ
        </button>
      </div>
    </Modal>
  );
}
