-- ============================================================
-- نواة الصالون: الفروع، الإعدادات، التصنيفات، الخدمات، الموظفات، الجداول
-- ============================================================

create table branches (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text not null,
  address       text,
  phone         text,
  location      jsonb, -- {lat, lng}
  -- أوقات عمل الفرع: {"sun":[["10:00","22:00"]], "fri":[["14:00","23:00"]], ...}
  working_hours jsonb not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  -- يسمح بمفاتيح أجنبية مركبة تضمن أن المرجع يتبع نفس الصالون
  unique (tenant_id, id)
);
create index branches_tenant_idx on branches (tenant_id);

-- إعدادات الصالون المرنة (صف واحد لكل صالون — يُنشأ تلقائيًا عند إضافة الصالون)
create table tenant_settings (
  tenant_id                 uuid primary key references tenants(id) on delete cascade,
  cancellation_window_hours int not null default 6,           -- مهلة الإلغاء المجاني
  deposit_mode              text not null default 'none' check (deposit_mode in ('none','optional','required')),
  deposit_percent           numeric(5,2) not null default 20,
  slot_granularity_minutes  int not null default 15, -- خطوة عرض الأوقات المتاحة
  allowed_payment_methods   payment_method[] not null default '{cash}',
  -- مفاتيح تشغيل/إيقاف الميزات (تُقاطَع مع features خطة الاشتراك في طبقة التطبيق)
  features  jsonb not null default '{"loyalty":true,"gift_cards":true,"referrals":true,"reviews":true,"online_payment":false,"waitlist":true}',
  -- إعدادات الولاء: نقاط لكل ريال، معدل الاستبدال، عتبات المستويات
  loyalty   jsonb not null default '{"points_per_sar":1,"redeem_rate_sar_per_100_points":5,"tiers":{"silver":1000,"gold":3000,"vip":7000}}',
  -- سياسة عدم الحضور: بعد كم غياب يُفرض عربون إجباري
  no_show_policy jsonb not null default '{"max_no_shows":2,"force_deposit":true}',
  locale_default text not null default 'ar',
  timezone       text not null default 'Asia/Riyadh',
  updated_at     timestamptz not null default now()
);

create trigger tenant_settings_updated_at before update on tenant_settings
  for each row execute function set_updated_at();

create table categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  sort       int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);
create index categories_tenant_idx on categories (tenant_id);

create table services (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  category_id      uuid,
  branch_id        uuid, -- null = متاحة في كل الفروع
  name             text not null,
  description      text,
  duration_minutes int not null check (duration_minutes between 5 and 480),
  buffer_minutes   int not null default 0, -- وقت تجهيز بعد الخدمة
  price            numeric(10,2) not null check (price >= 0),
  image_url        text,
  sort             int not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, id),
  -- مفاتيح مركبة: المرجع يجب أن يتبع نفس الصالون — تمنع أي ربط بين صالونين
  foreign key (tenant_id, category_id) references categories (tenant_id, id) on delete set null (category_id),
  foreign key (tenant_id, branch_id)   references branches   (tenant_id, id) on delete set null (branch_id)
);
create index services_tenant_idx on services (tenant_id, is_active);

create trigger services_updated_at before update on services
  for each row execute function set_updated_at();

create table staff (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  user_id            uuid references auth.users(id) on delete set null, -- حساب الموظفة (بوابة الموظفات)
  branch_id          uuid,
  name               text not null,
  title              text,
  bio                text,
  avatar_url         text,
  commission_percent numeric(5,2) not null default 0,
  -- صلاحيات تعرضها بوابة الموظفة (يتحكم بها المدير)
  permissions        jsonb not null default '{"view_own_stats":true,"view_commission":true}',
  is_bookable        boolean not null default true, -- تظهر في مسار الحجز
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, branch_id) references branches (tenant_id, id) on delete set null (branch_id)
);
create index staff_tenant_idx on staff (tenant_id, is_active);
create index staff_user_idx on staff (user_id);

create trigger staff_updated_at before update on staff
  for each row execute function set_updated_at();

-- الخدمات التي تقدمها كل موظفة
create table staff_services (
  tenant_id  uuid not null references tenants(id) on delete cascade,
  staff_id   uuid not null,
  service_id uuid not null,
  primary key (staff_id, service_id),
  foreign key (tenant_id, staff_id)   references staff    (tenant_id, id) on delete cascade,
  foreign key (tenant_id, service_id) references services (tenant_id, id) on delete cascade
);

-- دوام الموظفة الأسبوعي — يسمح بأكثر من فترة في اليوم (دوام مقسّم صباحي/مسائي)
-- weekday: 0=الأحد ... 6=السبت (نفس ترقيم Postgres dow)
create table staff_schedules (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  staff_id   uuid not null,
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  breaks     jsonb not null default '[]', -- [["13:00","13:30"], ...] راحات داخل الفترة
  check (start_time < end_time),
  foreign key (tenant_id, staff_id) references staff (tenant_id, id) on delete cascade
);
create index staff_schedules_staff_idx on staff_schedules (staff_id, weekday);

-- إجازات واستئذانات (طلبات الموظفات تصل للإدارة بحالة pending)
create table staff_time_off (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  staff_id    uuid not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  status      time_off_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (starts_at < ends_at),
  foreign key (tenant_id, staff_id) references staff (tenant_id, id) on delete cascade
);
create index staff_time_off_staff_idx on staff_time_off (staff_id, starts_at);
