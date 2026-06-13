-- ============================================================
-- نظام قاعدة العملاء (CRM): العميلات، ملف الجمال، الوسوم، الملاحظات
-- ============================================================

create table customers (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete set null, -- يُربط عند تسجيلها بـ OTP
  name             text not null,
  -- يُخزَّن الجوال منسقًا دوليًا: +9665XXXXXXXX (التطبيع في طبقة التطبيق)
  phone            text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  email            citext,
  birth_date       date,
  gender           text,
  avatar_url       text,
  -- ملف الجمال: نوع البشرة، لون الصبغة، الحساسيات، الخدمات المفضلة...
  beauty_profile   jsonb not null default '{}',
  tier             customer_tier not null default 'bronze',
  points_balance   int not null default 0,
  wallet_balance   numeric(10,2) not null default 0,
  referral_code    text not null default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  referred_by      uuid,
  marketing_opt_in boolean not null default true, -- موافقتها على رسائل واتساب التسويقية
  visits_count     int not null default 0,
  total_spent      numeric(12,2) not null default 0,
  no_show_count    int not null default 0,
  last_visit_at    timestamptz,
  source           text not null default 'online' check (source in ('online','manual','imported')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, phone),
  unique (tenant_id, referral_code),
  unique (tenant_id, id),
  foreign key (tenant_id, referred_by) references customers (tenant_id, id) on delete set null (referred_by)
);
create index customers_tenant_visit_idx on customers (tenant_id, last_visit_at);
create index customers_tenant_tier_idx  on customers (tenant_id, tier);
create index customers_user_idx         on customers (user_id);
-- بحث ضبابي سريع في لوحة CRM (اسم أو جوال)
create index customers_name_trgm_idx  on customers using gin (name gin_trgm_ops);
create index customers_phone_trgm_idx on customers using gin (phone gin_trgm_ops);

create trigger customers_updated_at before update on customers
  for each row execute function set_updated_at();

-- حماية الحقول الحساسة: العميلة تعدّل بياناتها الشخصية فقط،
-- ولا تستطيع تغيير نقاطها أو محفظتها أو مستواها من واجهة الـ API —
-- لا عند التسجيل الذاتي (insert) ولا عند التعديل (update)
create or replace function public.protect_customer_fields() returns trigger
language plpgsql as $$
declare
  -- العمليات الداخلية (التريغرات ودوال security definer) تمر بدور postgres/service_role
  sys boolean := current_user in ('postgres','supabase_admin','service_role');
begin
  if tg_op = 'INSERT' then
    if sys or is_super_admin() or is_tenant_desk(new.tenant_id) then
      return new;
    end if;
    -- تسجيل ذاتي: تبدأ دائمًا بالقيم الافتراضية
    new.tier           := 'bronze';
    new.points_balance := 0;
    new.wallet_balance := 0;
    new.visits_count   := 0;
    new.total_spent    := 0;
    new.no_show_count  := 0;
    new.last_visit_at  := null;
    new.referred_by    := null; -- ربط الإحالة يتم عبر RPC موثوق في مرحلة الولاء
    new.source         := 'online';
    return new;
  end if;
  if sys or is_super_admin() or is_tenant_desk(old.tenant_id) then
    return new;
  end if;
  new.tenant_id      := old.tenant_id;
  new.user_id        := old.user_id;
  new.tier           := old.tier;
  new.points_balance := old.points_balance;
  new.wallet_balance := old.wallet_balance;
  new.visits_count   := old.visits_count;
  new.total_spent    := old.total_spent;
  new.no_show_count  := old.no_show_count;
  new.last_visit_at  := old.last_visit_at;
  new.referral_code  := old.referral_code;
  new.referred_by    := old.referred_by;
  return new;
end;
$$;

create trigger customers_protect before insert or update on customers
  for each row execute function protect_customer_fields();

-- وسوم مخصصة ينشئها المدير (VIP، جديدة، حساسة...)
create table customer_tags (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name      text not null,
  color     text not null default '#8b5cf6',
  unique (tenant_id, name),
  unique (tenant_id, id)
);

create table customer_tag_links (
  tenant_id   uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null,
  tag_id      uuid not null,
  primary key (customer_id, tag_id),
  foreign key (tenant_id, customer_id) references customers     (tenant_id, id) on delete cascade,
  foreign key (tenant_id, tag_id)      references customer_tags (tenant_id, id) on delete cascade
);

-- ملاحظات داخلية للإدارة — لا تظهر للعميلة أبدًا (RLS)
create table customer_notes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null,
  author_id   uuid references auth.users(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade
);
create index customer_notes_customer_idx on customer_notes (customer_id, created_at desc);

-- التصنيف الذكي: جديدة / نشطة / معرضة للفقدان / مفقودة — يُحسب ولا يُخزَّن
create view customer_segments
with (security_invoker = true) as
select c.*,
  case
    when c.visits_count = 0 then 'new'
    when c.last_visit_at >= now() - interval '30 days' then 'active'
    when c.last_visit_at >= now() - interval '90 days' then 'at_risk'
    else 'lost'
  end as segment
from customers c;
