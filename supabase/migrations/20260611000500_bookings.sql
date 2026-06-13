-- ============================================================
-- محرك الحجوزات: الحجوزات، عناصرها، أقفال المواعيد، قائمة الانتظار
-- ============================================================

-- كل صف حجز = فترة متصلة لموظفة واحدة.
--  * أكثر من خدمة بنفس الزيارة → عناصر booking_items داخل نفس الحجز (متتابعة زمنيًا)
--  * حجز جماعي (عروس وصديقاتها، عدة موظفات بنفس الوقت) → عدة حجوزات تشترك في group_id
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  branch_id       uuid,
  customer_id     uuid not null,
  staff_id        uuid not null,
  group_id        uuid, -- يربط الحجوزات الجماعية
  status          booking_status not null default 'pending',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  total_amount    numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  deposit_amount  numeric(10,2) not null default 0,
  payment_status  payment_status not null default 'unpaid',
  payment_method  payment_method,
  coupon_id       uuid, -- FK يُضاف في migration الكوبونات
  source          booking_source not null default 'online',
  customer_note   text,
  internal_note   text,
  cancel_reason   text,
  cancelled_at    timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (starts_at < ends_at),
  unique (tenant_id, id),
  foreign key (tenant_id, branch_id)   references branches  (tenant_id, id) on delete set null (branch_id),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, staff_id)    references staff     (tenant_id, id)
);

-- ⭐ منع تعارض الحجوزات على مستوى قاعدة البيانات نفسها:
-- لا يمكن لحجزين فعّالين أن يتداخلا زمنيًا لنفس الموظفة، مهما تسابقت الطلبات
alter table bookings add constraint bookings_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending','confirmed','in_progress'));

create index bookings_tenant_time_idx on bookings (tenant_id, starts_at);
create index bookings_staff_time_idx  on bookings (staff_id, starts_at);
create index bookings_customer_idx    on bookings (customer_id, starts_at desc);
create index bookings_group_idx       on bookings (group_id) where group_id is not null;

create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- خدمات الزيارة الواحدة — مع لقطة من الاسم والسعر وقت الحجز (لا تتأثر بتعديلات لاحقة)
create table booking_items (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  booking_id       uuid not null,
  service_id       uuid not null,
  service_name     text not null,
  price            numeric(10,2) not null,
  duration_minutes int not null,
  sort             int not null default 0,
  foreign key (tenant_id, booking_id) references bookings (tenant_id, id) on delete cascade,
  foreign key (tenant_id, service_id) references services (tenant_id, id)
);
create index booking_items_booking_idx on booking_items (booking_id);

-- قفل مؤقت للموعد أثناء إتمام العميلة للحجز (5 دقائق) —
-- دالة الأوقات المتاحة (المرحلة 1) تستثني الأقفال غير المنتهية،
-- وتنظيفها يكون بمهمة pg_cron دورية
create table booking_holds (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  staff_id      uuid not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  session_token text not null,
  expires_at    timestamptz not null default now() + interval '5 minutes',
  check (starts_at < ends_at),
  foreign key (tenant_id, staff_id) references staff (tenant_id, id) on delete cascade
);
create index booking_holds_staff_idx on booking_holds (staff_id, expires_at);

-- قائمة الانتظار الذكية: عند أي إلغاء يصل واتساب تلقائي للمنتظرات
create table waitlist (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  customer_id    uuid not null,
  service_id     uuid not null,
  staff_id       uuid, -- null = أي موظفة
  preferred_date date not null,
  time_window    jsonb, -- {"from":"16:00","to":"21:00"}
  status         text not null default 'waiting'
                 check (status in ('waiting','notified','booked','expired','cancelled')),
  notified_at    timestamptz,
  created_at     timestamptz not null default now(),
  foreign key (tenant_id, customer_id) references customers (tenant_id, id) on delete cascade,
  foreign key (tenant_id, service_id)  references services  (tenant_id, id) on delete cascade,
  foreign key (tenant_id, staff_id)    references staff     (tenant_id, id) on delete set null (staff_id)
);
create index waitlist_tenant_date_idx on waitlist (tenant_id, preferred_date, status);

-- تحديث إحصائيات العميلة تلقائيًا عند اكتمال الحجز أو الغياب
create or replace function public.apply_booking_transition() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update customers set
      visits_count  = visits_count + 1,
      total_spent   = total_spent + new.total_amount,
      last_visit_at = new.ends_at
    where id = new.customer_id;
  elsif new.status = 'no_show' and old.status is distinct from 'no_show' then
    update customers set no_show_count = no_show_count + 1
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

create trigger bookings_transition after update on bookings
  for each row execute function apply_booking_transition();

-- Realtime: التقويم يتحدث لحظيًا في لوحة الإدارة
do $$
begin
  alter publication supabase_realtime add table public.bookings;
  alter publication supabase_realtime add table public.booking_holds;
exception when undefined_object then
  null; -- بيئة بدون Supabase Realtime
end;
$$;
