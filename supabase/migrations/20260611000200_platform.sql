-- ============================================================
-- طبقة المنصة (Super Admin): الصالونات، الخطط، الاشتراكات، الأعضاء
-- ============================================================

-- مالكو المنصة (أنت)
create table platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- خطط الاشتراك (أساسية / احترافية / متقدمة)
create table plans (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  name_en       text,
  price_monthly numeric(10,2) not null,
  price_yearly  numeric(10,2),
  features      jsonb not null default '{}',  -- مفاتيح الميزات المسموحة للخطة
  limits        jsonb not null default '{}',  -- حدود: max_staff, max_branches
  sort          int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- الصالونات المشتركة (المستأجرون)
create table tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            citext not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'), -- الساب دومين
  name            text not null,
  custom_domain   citext unique,
  logo_url        text,
  cover_url       text,
  brand           jsonb not null default '{}', -- الألوان والخطوط والهوية
  about           text,
  phone           text,
  whatsapp_number text,
  city            text,
  status          tenant_status not null default 'trial',
  trial_ends_at   timestamptz not null default now() + interval '14 days',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger tenants_updated_at before update on tenants
  for each row execute function set_updated_at();

-- اشتراكات الصالونات
create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  plan_id                  uuid not null references plans(id),
  status                   subscription_status not null default 'trialing',
  billing_cycle            text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  current_period_start     timestamptz not null default now(),
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  provider                 text, -- moyasar / tap
  provider_customer_id     text,
  provider_subscription_id text,
  created_at               timestamptz not null default now()
);
create index subscriptions_tenant_idx on subscriptions (tenant_id);

-- فريق كل صالون (المدير/المشرفة/الاستقبال/الموظفة) مرتبطون بحسابات auth
create table tenant_members (
  tenant_id    uuid not null references tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         tenant_role not null,
  display_name text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on tenant_members (user_id);

-- ============================================================
-- دوال مساعدة للصلاحيات — security definer لتجاوز RLS بأمان داخل السياسات
-- ============================================================

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function public.has_tenant_role(t uuid, roles tenant_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_members m
    where m.tenant_id = t and m.user_id = auth.uid()
      and m.is_active and m.role = any(roles)
  );
$$;

-- أي عضو نشط في الصالون (يشمل الموظفات)
create or replace function public.is_tenant_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_members m
    where m.tenant_id = t and m.user_id = auth.uid() and m.is_active
  );
$$;

-- إدارة الصالون: مالك أو مشرفة
create or replace function public.is_tenant_admin(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_tenant_role(t, array['owner','manager']::tenant_role[]);
$$;

-- من يدير العمليات اليومية: مالك / مشرفة / استقبال
create or replace function public.is_tenant_desk(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_tenant_role(t, array['owner','manager','receptionist']::tenant_role[]);
$$;
