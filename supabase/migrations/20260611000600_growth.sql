-- ============================================================
-- النمو: نقاط الولاء، بطاقات الهدايا، الكوبونات، الباقات، الإحالة، التقييمات
-- ============================================================

-- دفتر حركات النقاط (موجب = كسب، سالب = استبدال) — الرصيد يُحدَّث بالتريغر
create table loyalty_transactions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null,
  points      int not null,
  reason      points_reason not null,
  booking_id  uuid,
  note        text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, booking_id)  references bookings  (tenant_id, id) on delete set null (booking_id)
);
create index loyalty_tx_customer_idx on loyalty_transactions (customer_id, created_at desc);

create or replace function public.apply_loyalty_tx() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update customers set points_balance = points_balance + new.points
  where id = new.customer_id;
  -- إعادة احتساب المستوى من عتبات tenant_settings.loyalty تُضاف في مرحلة الولاء
  return new;
end;
$$;

create trigger loyalty_tx_apply after insert on loyalty_transactions
  for each row execute function apply_loyalty_tx();

-- بطاقات هدايا رقمية: تُشترى وتُرسل واتساب لصديقة مع رسالة شخصية وتصميم
create table gift_cards (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  code              text not null,
  amount            numeric(10,2) not null check (amount > 0),
  balance           numeric(10,2) not null check (balance >= 0),
  buyer_customer_id uuid,
  recipient_name    text,
  recipient_phone   text,
  message           text,
  design            text not null default 'classic',
  status            gift_card_status not null default 'active',
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (tenant_id, code),
  check (balance <= amount),
  foreign key (tenant_id, buyer_customer_id) references customers (tenant_id, id) on delete set null (buyer_customer_id)
);

create table coupons (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  code                  text not null,
  type                  discount_type not null,
  value                 numeric(10,2) not null check (value > 0),
  min_amount            numeric(10,2) not null default 0,
  max_uses              int,
  max_uses_per_customer int not null default 1,
  used_count            int not null default 0,
  valid_from            timestamptz not null default now(),
  valid_until           timestamptz,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, id)
);

create table coupon_redemptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  coupon_id   uuid not null,
  customer_id uuid not null,
  booking_id  uuid,
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, coupon_id)   references coupons   (tenant_id, id) on delete cascade,
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, booking_id)  references bookings  (tenant_id, id) on delete set null (booking_id)
);

-- ربط الحجز بالكوبون (أُجّل لوجود الجدولين الآن)
alter table bookings
  add constraint bookings_coupon_fk
  foreign key (tenant_id, coupon_id) references coupons (tenant_id, id) on delete set null (coupon_id);

-- الباقات: مثال 4 جلسات بسعر 3
create table packages (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  name           text not null,
  description    text,
  price          numeric(10,2) not null,
  sessions_count int not null default 1,
  validity_days  int not null default 90,
  image_url      text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (tenant_id, id)
);

create table package_services (
  tenant_id  uuid not null references tenants(id) on delete cascade,
  package_id uuid not null,
  service_id uuid not null,
  primary key (package_id, service_id),
  foreign key (tenant_id, package_id) references packages (tenant_id, id) on delete cascade,
  foreign key (tenant_id, service_id) references services (tenant_id, id) on delete cascade
);

-- باقات اشترتها العميلات ورصيد جلساتها
create table customer_packages (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  customer_id    uuid not null,
  package_id     uuid not null,
  sessions_total int not null,
  sessions_used  int not null default 0,
  expires_at     timestamptz not null,
  purchased_at   timestamptz not null default now(),
  check (sessions_used <= sessions_total),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, package_id)  references packages  (tenant_id, id)
);
create index customer_packages_customer_idx on customer_packages (customer_id);

-- الإحالات: العميلة تشارك كودها وتُكافأ عند أول زيارة مكتملة للصديقة
create table referrals (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  referrer_id uuid not null,
  referred_id uuid not null,
  status      text not null default 'pending' check (status in ('pending','rewarded')),
  rewarded_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (tenant_id, referred_id),
  foreign key (tenant_id, referrer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, referred_id) references customers (tenant_id, id) on delete cascade
);

-- تقييم واحد لكل حجز مكتمل — يُنشر بعد موافقة الإدارة
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  booking_id   uuid not null unique,
  customer_id  uuid not null,
  staff_id     uuid,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  reply        text, -- رد الصالون
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  foreign key (tenant_id, booking_id)  references bookings  (tenant_id, id) on delete cascade,
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, staff_id)    references staff     (tenant_id, id) on delete set null (staff_id)
);
create index reviews_tenant_idx on reviews (tenant_id, is_published);

-- التقييم يرث بياناته من الحجز نفسه — يستحيل تقييم حجز غير مكتمل
-- أو انتحال تقييم لحجز عميلة أخرى (التريغر يعيد كتابة customer_id من الحجز،
-- فيفشل شرط سياسة RLS إن لم تكن صاحبة الحجز)
create or replace function public.reviews_from_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select tenant_id, customer_id, staff_id, status
    into b from bookings where id = new.booking_id;
  if not found then
    raise exception 'الحجز غير موجود';
  end if;
  if b.status <> 'completed' then
    raise exception 'لا يمكن تقييم حجز غير مكتمل';
  end if;
  new.tenant_id   := b.tenant_id;
  new.customer_id := b.customer_id;
  new.staff_id    := b.staff_id;
  new.is_published := false;
  return new;
end;
$$;

create trigger reviews_fill before insert on reviews
  for each row execute function reviews_from_booking();
