-- ============================================================
-- مركز رسائل الواتساب: القوالب، الحملات، سجل الرسائل
-- ============================================================

-- قوالب الرسائل التلقائية — المدير يحرر النص ويفعّل/يعطّل كل قالب
create table whatsapp_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  key        text not null, -- booking_confirmed / reminder_24h / reminder_2h / thank_review / winback_30d / birthday
  name       text not null,
  body       text not null, -- يدعم متغيرات {{customer_name}} {{salon_name}} {{date}} {{time}} ...
  is_enabled boolean not null default true,
  unique (tenant_id, key)
);

-- حملات جماعية لشرائح من قاعدة العملاء (مثال: عميلات VIP فقط)
create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  name         text not null,
  body         text not null,
  -- شروط الشريحة: {"tier":["vip"],"segment":"at_risk","tags":[...],"min_visits":3}
  segment      jsonb not null default '{}',
  status       text not null default 'draft'
               check (status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at timestamptz,
  sent_count   int not null default 0,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (tenant_id, id)
);

-- سجل كل رسالة أُرسلت (يظهر في ملف العميلة بلوحة الإدارة)
create table whatsapp_messages (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  customer_id         uuid,
  to_phone            text not null,
  template_key        text,
  campaign_id         uuid,
  body                text not null,
  status              message_status not null default 'queued',
  provider_message_id text,
  error               text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, campaign_id) references campaigns (tenant_id, id) on delete set null (campaign_id)
);
create index whatsapp_messages_customer_idx on whatsapp_messages (tenant_id, customer_id, created_at desc);

-- ============================================================
-- عند إضافة صالون جديد: تُنشأ إعداداته وقوالبه الافتراضية تلقائيًا
-- ============================================================
create or replace function public.seed_tenant_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into tenant_settings (tenant_id) values (new.id);

  insert into whatsapp_templates (tenant_id, key, name, body) values
    (new.id, 'booking_confirmed', 'تأكيد الحجز',
     'مرحبًا {{customer_name}} 🌸 تم تأكيد حجزك في {{salon_name}} يوم {{date}} الساعة {{time}}. نسعد بخدمتك!'),
    (new.id, 'reminder_24h', 'تذكير قبل 24 ساعة',
     'نذكّرك بموعدك غدًا {{date}} الساعة {{time}} في {{salon_name}} 💆‍♀️ للتعديل أو الإلغاء: {{manage_link}}'),
    (new.id, 'reminder_2h', 'تذكير قبل ساعتين',
     'موعدك بعد ساعتين ⏰ ننتظرك في {{salon_name}}!'),
    (new.id, 'thank_review', 'شكر وطلب تقييم',
     'شكرًا لزيارتك {{salon_name}} اليوم 🌷 يسعدنا تقييمك لتجربتك: {{review_link}}'),
    (new.id, 'winback_30d', 'اشتقنا لك',
     'اشتقنا لك يا {{customer_name}} 💕 لك خصم {{discount}} على زيارتك القادمة بكود {{coupon_code}}'),
    (new.id, 'birthday', 'تهنئة عيد الميلاد',
     'كل عام وأنتِ بخير يا {{customer_name}} 🎂 هديتك بانتظارك في {{salon_name}}: {{gift}}');

  return new;
end;
$$;

create trigger tenants_seed_defaults after insert on tenants
  for each row execute function seed_tenant_defaults();
