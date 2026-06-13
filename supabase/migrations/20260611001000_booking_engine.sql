-- ============================================================
-- المرحلة 1 — محرك الحجوزات ⭐
--
--  * validate_booking_transition: دورة حياة الحجز — انتقالات الحالة المسموحة فقط
--  * protect_booking_fields: الموظفة تغيّر الحالة والملاحظة فقط، لا المبالغ والأوقات
--  * get_available_slots: الأوقات المتاحة = دوام − حجوزات − راحات − إجازات − أقفال
--  * hold_slot: قفل الموعد 5 دقائق أثناء إتمام العميلة للحجز
--  * create_booking: إنشاء الحجز ذرّيًا (قيد EXCLUDE + قفل استشاري ضد السباق)
--  * cancel_booking: يحترم مهلة الإلغاء من إعدادات الصالون
-- ============================================================

-- دورة حياة الحجز: لا قفز بين الحالات ولا تراجع عن الحالات النهائية
create or replace function public.validate_booking_transition() returns trigger
language plpgsql as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if not (
    (old.status = 'pending'     and new.status in ('confirmed','cancelled')) or
    (old.status = 'confirmed'   and new.status in ('in_progress','completed','cancelled','no_show')) or
    (old.status = 'in_progress' and new.status in ('completed','cancelled'))
  ) then
    raise exception 'انتقال حالة غير مسموح: % ← %', new.status, old.status;
  end if;
  return new;
end;
$$;

create trigger bookings_validate_transition before update of status on bookings
  for each row execute function validate_booking_transition();

-- بوابة الموظفة: تبدأ الخدمة وتنهيها وتكتب ملاحظة — لا تلمس المبالغ أو الأوقات
create or replace function public.protect_booking_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('postgres','supabase_admin','service_role')
     or is_super_admin() or is_tenant_desk(old.tenant_id) then
    return new;
  end if;
  new.tenant_id       := old.tenant_id;
  new.branch_id       := old.branch_id;
  new.customer_id     := old.customer_id;
  new.staff_id        := old.staff_id;
  new.group_id        := old.group_id;
  new.starts_at       := old.starts_at;
  new.ends_at         := old.ends_at;
  new.total_amount    := old.total_amount;
  new.discount_amount := old.discount_amount;
  new.deposit_amount  := old.deposit_amount;
  new.payment_status  := old.payment_status;
  new.payment_method  := old.payment_method;
  new.coupon_id       := old.coupon_id;
  new.source          := old.source;
  new.customer_note   := old.customer_note;
  new.created_by      := old.created_by;
  return new;
end;
$$;

create trigger bookings_protect before update on bookings
  for each row execute function protect_booking_fields();

-- ============================================================
-- الأوقات المتاحة ليوم محدد
-- p_staff = null → كل الموظفات المؤهلات (اللواتي يقدمن كل الخدمات المطلوبة)
-- ============================================================
create or replace function public.get_available_slots(
  p_tenant      uuid,
  p_service_ids uuid[],
  p_date        date,
  p_staff       uuid default null
) returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz    text;
  v_step  int;
  v_total int;
  v_count int;
begin
  select s.timezone, s.slot_granularity_minutes into v_tz, v_step
  from tenant_settings s where s.tenant_id = p_tenant;
  if not found then
    raise exception 'الصالون غير موجود';
  end if;

  select sum(s.duration_minutes + s.buffer_minutes)::int, count(*)::int
    into v_total, v_count
  from services s
  where s.tenant_id = p_tenant and s.id = any(p_service_ids) and s.is_active;

  if v_count is distinct from array_length(p_service_ids, 1) or coalesce(v_count, 0) = 0 then
    raise exception 'خدمة غير صالحة';
  end if;

  return query
  with eligible_staff as (
    select st.id
    from staff st
    where st.tenant_id = p_tenant and st.is_active and st.is_bookable
      and (p_staff is null or st.id = p_staff)
      and (select count(*) from staff_services ss
           where ss.staff_id = st.id and ss.service_id = any(p_service_ids))
          = array_length(p_service_ids, 1)
  ),
  windows as (
    select es.id as sid,
           ((p_date::text || ' ' || sch.start_time::text)::timestamp at time zone v_tz) as w_start,
           ((p_date::text || ' ' || sch.end_time::text)::timestamp   at time zone v_tz) as w_end,
           sch.breaks
    from eligible_staff es
    join staff_schedules sch on sch.staff_id = es.id
    where sch.weekday = extract(dow from p_date)::int
  ),
  slots as (
    select w.sid,
           gs as s_start,
           gs + make_interval(mins => v_total) as s_end,
           w.breaks
    from windows w
    cross join lateral generate_series(
      w.w_start,
      w.w_end - make_interval(mins => v_total),
      make_interval(mins => v_step)
    ) gs
  )
  select sl.sid, sl.s_start, sl.s_end
  from slots sl
  where sl.s_start > now()
    and not exists ( -- خارج الراحات
      select 1 from jsonb_array_elements(sl.breaks) br
      where tstzrange(
              ((p_date::text || ' ' || (br->>0))::timestamp at time zone v_tz),
              ((p_date::text || ' ' || (br->>1))::timestamp at time zone v_tz)
            ) && tstzrange(sl.s_start, sl.s_end)
    )
    and not exists ( -- لا تتعارض مع حجز فعّال
      select 1 from bookings b
      where b.staff_id = sl.sid
        and b.status in ('pending','confirmed','in_progress')
        and tstzrange(b.starts_at, b.ends_at) && tstzrange(sl.s_start, sl.s_end)
    )
    and not exists ( -- لا تتعارض مع قفل غير منتهٍ
      select 1 from booking_holds h
      where h.staff_id = sl.sid and h.expires_at > now()
        and tstzrange(h.starts_at, h.ends_at) && tstzrange(sl.s_start, sl.s_end)
    )
    and not exists ( -- لا تقع في إجازة معتمدة
      select 1 from staff_time_off t
      where t.staff_id = sl.sid and t.status = 'approved'
        and tstzrange(t.starts_at, t.ends_at) && tstzrange(sl.s_start, sl.s_end)
    )
  order by sl.s_start, sl.sid;
end;
$$;

-- ============================================================
-- قفل الموعد أثناء إتمام الحجز (الخطوة الأخيرة قبل الدفع)
-- ============================================================
create or replace function public.hold_slot(
  p_tenant      uuid,
  p_staff       uuid,
  p_service_ids uuid[],
  p_starts_at   timestamptz
) returns table (hold_id uuid, expires_at timestamptz, session_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_ends  timestamptz;
  v_token text := replace(gen_random_uuid()::text, '-', '');
  v_id    uuid;
  v_exp   timestamptz;
begin
  if not exists (
    select 1 from staff st
    where st.id = p_staff and st.tenant_id = p_tenant and st.is_active and st.is_bookable
  ) then
    raise exception 'الموظفة غير متاحة';
  end if;

  select sum(s.duration_minutes + s.buffer_minutes)::int into v_total
  from services s
  where s.tenant_id = p_tenant and s.id = any(p_service_ids) and s.is_active;
  if v_total is null then
    raise exception 'خدمة غير صالحة';
  end if;
  v_ends := p_starts_at + make_interval(mins => v_total);

  -- قفل استشاري على الموظفة: طلبان متزامنان على نفس الوقت لا يمران معًا
  perform pg_advisory_xact_lock(hashtextextended(p_staff::text, 0));

  if exists (
    select 1 from bookings b
    where b.staff_id = p_staff
      and b.status in ('pending','confirmed','in_progress')
      and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_starts_at, v_ends)
  ) or exists (
    select 1 from booking_holds h
    where h.staff_id = p_staff and h.expires_at > now()
      and tstzrange(h.starts_at, h.ends_at) && tstzrange(p_starts_at, v_ends)
  ) then
    raise exception 'الوقت لم يعد متاحًا';
  end if;

  insert into booking_holds (tenant_id, staff_id, starts_at, ends_at, session_token)
  values (p_tenant, p_staff, p_starts_at, v_ends, v_token)
  returning id, booking_holds.expires_at into v_id, v_exp;

  return query select v_id, v_exp, v_token;
end;
$$;

-- ============================================================
-- إنشاء الحجز — ذرّي بالكامل
-- العميلة تُشتق من حسابها؛ الإدارة/النظام يمرر p_customer للحجوزات الهاتفية
-- ============================================================
create or replace function public.create_booking(
  p_tenant        uuid,
  p_staff         uuid,
  p_service_ids   uuid[],
  p_starts_at     timestamptz,
  p_customer      uuid default null,
  p_source        booking_source default 'online',
  p_customer_note text default null,
  p_hold          uuid default null,
  p_group         uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sys      boolean := current_user in ('postgres','supabase_admin','service_role');
  v_desk     boolean;
  v_customer uuid;
  v_minutes  int;
  v_price    numeric(12,2);
  v_count    int;
  v_ends     timestamptz;
  v_booking  uuid;
  v_branch   uuid;
  v_dep_mode text;
  v_dep_pct  numeric;
  v_deposit  numeric(10,2) := 0;
begin
  v_desk := v_sys or is_super_admin() or is_tenant_desk(p_tenant);

  if v_desk and p_customer is not null then
    select c.id into v_customer from customers c
    where c.id = p_customer and c.tenant_id = p_tenant;
  else
    select c.id into v_customer from customers c
    where c.tenant_id = p_tenant and c.user_id = auth.uid();
  end if;
  if v_customer is null then
    raise exception 'لا يوجد ملف عميلة لهذا الحساب في الصالون';
  end if;

  select st.branch_id into v_branch from staff st
  where st.id = p_staff and st.tenant_id = p_tenant and st.is_active;
  if not found then
    raise exception 'الموظفة غير متاحة';
  end if;

  select sum(s.duration_minutes + s.buffer_minutes)::int, sum(s.price), count(*)::int
    into v_minutes, v_price, v_count
  from services s
  where s.tenant_id = p_tenant and s.id = any(p_service_ids) and s.is_active;

  if v_count is distinct from array_length(p_service_ids, 1) or coalesce(v_count, 0) = 0 then
    raise exception 'خدمة غير صالحة';
  end if;

  if (select count(*) from staff_services ss
      where ss.staff_id = p_staff and ss.service_id = any(p_service_ids)) <> v_count then
    raise exception 'الموظفة لا تقدم إحدى الخدمات المختارة';
  end if;

  v_ends := p_starts_at + make_interval(mins => v_minutes);
  if p_starts_at <= now() and not v_desk then
    raise exception 'لا يمكن الحجز في وقت ماضٍ';
  end if;

  select ts.deposit_mode, ts.deposit_percent into v_dep_mode, v_dep_pct
  from tenant_settings ts where ts.tenant_id = p_tenant;
  if v_dep_mode = 'required' then
    v_deposit := round(v_price * v_dep_pct / 100, 2);
  end if;

  -- قفل استشاري ثم تحقق من أقفال الآخرين — قيد EXCLUDE يتكفل بتعارض الحجوزات
  perform pg_advisory_xact_lock(hashtextextended(p_staff::text, 0));

  if exists (
    select 1 from booking_holds h
    where h.staff_id = p_staff and h.expires_at > now()
      and (p_hold is null or h.id <> p_hold)
      and tstzrange(h.starts_at, h.ends_at) && tstzrange(p_starts_at, v_ends)
  ) then
    raise exception 'الوقت محجوز مؤقتًا لعميلة أخرى — حاولي بعد دقائق';
  end if;

  begin
    insert into bookings (
      tenant_id, branch_id, customer_id, staff_id, group_id, status,
      starts_at, ends_at, total_amount, deposit_amount, source, customer_note, created_by
    ) values (
      p_tenant, v_branch, v_customer, p_staff, p_group,
      -- مع عربون إجباري أونلاين: ينتظر الدفع؛ غير ذلك يتأكد فورًا
      case when p_source = 'online' and v_deposit > 0
           then 'pending'::booking_status else 'confirmed'::booking_status end,
      p_starts_at, v_ends, v_price, v_deposit, p_source, p_customer_note, auth.uid()
    ) returning id into v_booking;
  exception when exclusion_violation then
    raise exception 'عذرًا، حُجز هذا الوقت للتو — اختاري وقتًا آخر';
  end;

  insert into booking_items (tenant_id, booking_id, service_id, service_name, price, duration_minutes, sort)
  select p_tenant, v_booking, s.id, s.name, s.price, s.duration_minutes, ord.n::int
  from unnest(p_service_ids) with ordinality as ord(sid, n)
  join services s on s.id = ord.sid;

  if p_hold is not null then
    delete from booking_holds where id = p_hold;
  end if;

  return v_booking;
end;
$$;

-- ============================================================
-- إلغاء الحجز — العميلة ضمن المهلة فقط، الإدارة في أي وقت
-- ============================================================
create or replace function public.cancel_booking(
  p_booking uuid,
  p_reason  text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_sys    boolean := current_user in ('postgres','supabase_admin','service_role');
  b        record;
  v_desk   boolean;
  v_window int;
begin
  select * into b from bookings where id = p_booking;
  if not found then
    raise exception 'الحجز غير موجود';
  end if;

  v_desk := v_sys or is_super_admin() or is_tenant_desk(b.tenant_id);

  if not v_desk then
    if not exists (
      select 1 from customers c where c.id = b.customer_id and c.user_id = auth.uid()
    ) then
      raise exception 'غير مصرح';
    end if;
    select ts.cancellation_window_hours into v_window
    from tenant_settings ts where ts.tenant_id = b.tenant_id;
    if now() > b.starts_at - make_interval(hours => coalesce(v_window, 0)) then
      raise exception 'انتهت مهلة الإلغاء المجاني — تواصلي مع الصالون';
    end if;
  end if;

  if b.status not in ('pending','confirmed')
     and not (v_desk and b.status = 'in_progress') then
    raise exception 'لا يمكن إلغاء حجز حالته %', b.status;
  end if;

  update bookings
  set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
  where id = p_booking;

  -- إشعار قائمة الانتظار بالوقت المتاح يُبنى في مرحلة الواتساب (Realtime/Make)
end;
$$;

-- تنظيف الأقفال المنتهية — تُجدول كل 10 دقائق
create or replace function public.cleanup_expired_holds() returns int
language sql security definer set search_path = public as $$
  with del as (
    delete from booking_holds where expires_at < now() returning 1
  )
  select count(*)::int from del;
$$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('cleanup-expired-holds', '*/10 * * * *',
                        'select public.cleanup_expired_holds()');
exception when others then
  raise notice 'pg_cron غير متاح هنا — جدولة التنظيف من لوحة Supabase في الإنتاج';
end;
$$;

-- صلاحيات التنفيذ: الكتابة للمسجلات دخولًا فقط، وعرض الأوقات متاح للجميع
revoke all on function public.create_booking(uuid, uuid, uuid[], timestamptz, uuid, booking_source, text, uuid, uuid) from public, anon;
revoke all on function public.cancel_booking(uuid, text) from public, anon;
revoke all on function public.hold_slot(uuid, uuid, uuid[], timestamptz) from public, anon;
grant execute on function public.create_booking(uuid, uuid, uuid[], timestamptz, uuid, booking_source, text, uuid, uuid) to authenticated, service_role;
grant execute on function public.cancel_booking(uuid, text) to authenticated, service_role;
grant execute on function public.hold_slot(uuid, uuid, uuid[], timestamptz) to authenticated, service_role;
grant execute on function public.get_available_slots(uuid, uuid[], date, uuid) to anon, authenticated, service_role;
