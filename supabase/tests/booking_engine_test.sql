-- ============================================================
-- اختبارات محرك الحجوزات — تعمل على بيانات seed التجريبية
-- التشغيل: انظر README — كل شيء داخل معاملة تُلغى في النهاية
-- ============================================================
\set ON_ERROR_STOP on
begin;

-- دالة مساعدة مؤقتة: تبني timestamptz من يوم ووقت بتوقيت الرياض
create function pg_temp.ts_at(d date, t text) returns timestamptz
language sql as $$
  select (d::text || ' ' || t)::timestamp at time zone 'Asia/Riyadh'
$$;

do $$
declare
  c_tenant   constant uuid := '11111111-1111-1111-1111-111111111111';
  c_sara     constant uuid := '55555555-5555-5555-5555-000000000001'; -- خبيرة الشعر
  c_reem     constant uuid := '55555555-5555-5555-5555-000000000003'; -- فنية الأظافر
  c_cut      constant uuid := '44444444-4444-4444-4444-000000000001'; -- قص وسشوار 60+10د 120ر
  c_nails    constant uuid := '44444444-4444-4444-4444-000000000006'; -- مناكير 75+5د 150ر
  c_amal     constant uuid := '66666666-6666-6666-6666-000000000001';
  c_hind     constant uuid := '66666666-6666-6666-6666-000000000002';
  v_date     date;
  v_slots    int;
  v_b1       uuid;
  v_b2       uuid;
  v_b3       uuid;
  v_hold     uuid;
  v_n        int;
  v_num      numeric;
  v_base_n   int;     -- خط أساس للمقارنة النسبية (قد توجد بيانات سابقة)
  v_base_num numeric;
  v_status   booking_status;
  v_failed   boolean;
begin
  -- يوم اختبار قادم فيه دوام (الجداول تغطي كل الأيام عدا الجمعة=5)
  select min(d)::date into v_date
  from generate_series(current_date + 1, current_date + 7, interval '1 day') d
  where extract(dow from d) <> 5;

  ---------------------------------------------------------------
  raise notice 'اختبار 1: الأوقات المتاحة تُحسب من الدوام وتستثني الراحة';
  ---------------------------------------------------------------
  select count(*) into v_slots
  from get_available_slots(c_tenant, array[c_cut], v_date);
  assert v_slots > 0, 'لا توجد أوقات متاحة إطلاقًا';

  -- لا وقت يبدأ قبل بداية الدوام (10:00) أو يتجاوز نهايته (22:00)
  select count(*) into v_n
  from get_available_slots(c_tenant, array[c_cut], v_date) s
  where s.starts_at < pg_temp.ts_at(v_date, '10:00') or s.ends_at > pg_temp.ts_at(v_date, '22:00');
  assert v_n = 0, 'وقت خارج الدوام: ' || v_n;

  -- لا وقت يتقاطع مع الراحة 17:00–17:30
  select count(*) into v_n
  from get_available_slots(c_tenant, array[c_cut], v_date) s
  where tstzrange(s.starts_at, s.ends_at) && tstzrange(pg_temp.ts_at(v_date,'17:00'), pg_temp.ts_at(v_date,'17:30'));
  assert v_n = 0, 'وقت داخل الراحة: ' || v_n;

  ---------------------------------------------------------------
  raise notice 'اختبار 2: إنشاء حجز + عناصره + يختفي الوقت من المتاح';
  ---------------------------------------------------------------
  v_b1 := create_booking(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '11:00'), c_amal);
  select status into v_status from bookings where id = v_b1;
  assert v_status = 'confirmed', 'بدون عربون يجب أن يتأكد فورًا، الحالة: ' || v_status;

  select count(*), sum(price) into v_n, v_num from booking_items where booking_id = v_b1;
  assert v_n = 1 and v_num = 120, 'عناصر الحجز غير صحيحة';

  select count(*) into v_n
  from get_available_slots(c_tenant, array[c_cut], v_date, c_sara) s
  where tstzrange(s.starts_at, s.ends_at) && tstzrange(pg_temp.ts_at(v_date,'11:00'), pg_temp.ts_at(v_date,'12:10'));
  assert v_n = 0, 'الوقت المحجوز ما زال يظهر متاحًا';

  ---------------------------------------------------------------
  raise notice 'اختبار 3: حجز متعارض عبر الدالة يُرفض برسالة لطيفة';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    perform create_booking(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '11:30'), c_hind);
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'الحجز المتعارض مرّ!';

  ---------------------------------------------------------------
  raise notice 'اختبار 4: إدخال مباشر متعارض يصده قيد EXCLUDE (سباق)';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    insert into bookings (tenant_id, customer_id, staff_id, status, starts_at, ends_at)
    values (c_tenant, c_hind, c_sara, 'confirmed', pg_temp.ts_at(v_date,'10:30'), pg_temp.ts_at(v_date,'11:30'));
  exception when exclusion_violation then
    v_failed := true;
  end;
  assert v_failed, 'قيد منع التعارض لم يعمل!';

  ---------------------------------------------------------------
  raise notice 'اختبار 5: نفس الوقت لموظفة أخرى مسموح';
  ---------------------------------------------------------------
  v_b2 := create_booking(c_tenant, c_reem, array[c_nails], pg_temp.ts_at(v_date, '11:00'), c_hind);
  assert v_b2 is not null, 'الحجز لموظفة أخرى فشل';

  ---------------------------------------------------------------
  raise notice 'اختبار 6: الموظفة لا تقدم الخدمة → يُرفض';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    perform create_booking(c_tenant, c_reem, array[c_cut], pg_temp.ts_at(v_date, '15:00'), c_hind);
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'حجز خدمة لا تقدمها الموظفة مرّ!';

  ---------------------------------------------------------------
  raise notice 'اختبار 7: القفل المؤقت يمنع غيره ويُستهلك عند الحجز';
  ---------------------------------------------------------------
  select h.hold_id into v_hold
  from hold_slot(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '15:00')) h;
  assert v_hold is not null, 'القفل لم يُنشأ';

  v_failed := false;
  begin
    perform hold_slot(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '15:30'));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'قفل متداخل مرّ!';

  v_failed := false;
  begin
    perform create_booking(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '15:00'), c_hind);
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'الحجز فوق قفل عميلة أخرى مرّ!';

  -- صاحبة القفل نفسها تكمل الحجز ويُحذف القفل
  v_b3 := create_booking(c_tenant, c_sara, array[c_cut], pg_temp.ts_at(v_date, '15:00'), c_amal,
                         'online', null, v_hold);
  assert v_b3 is not null, 'إكمال الحجز بالقفل فشل';
  select count(*) into v_n from booking_holds where id = v_hold;
  assert v_n = 0, 'القفل لم يُحذف بعد الحجز';

  ---------------------------------------------------------------
  raise notice 'اختبار 8: دورة الحياة — الإكمال يحدّث إحصائيات العميلة';
  ---------------------------------------------------------------
  select visits_count, total_spent into v_base_n, v_base_num
  from customers where id = c_amal;

  update bookings set status = 'in_progress' where id = v_b1;
  update bookings set status = 'completed'   where id = v_b1;

  select visits_count, total_spent::int into v_n, v_num
  from customers where id = c_amal;
  assert v_n = v_base_n + 1 and v_num = v_base_num + 120,
    'إحصائيات العميلة لم تتحدث: ' || v_n || '/' || v_num
    || ' (الأساس ' || v_base_n || '/' || v_base_num || ')';

  v_failed := false;
  begin
    update bookings set status = 'confirmed' where id = v_b1; -- تراجع عن حالة نهائية
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'التراجع عن حالة نهائية مرّ!';

  ---------------------------------------------------------------
  raise notice 'اختبار 9: الإلغاء — مكتمل لا يُلغى، مؤكد يُلغى';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    perform cancel_booking(v_b1, 'تجربة');
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'إلغاء حجز مكتمل مرّ!';

  perform cancel_booking(v_b3, 'ظرف طارئ');
  select status into v_status from bookings where id = v_b3;
  assert v_status = 'cancelled', 'الإلغاء لم يعمل';

  -- الوقت يعود متاحًا بعد الإلغاء
  select count(*) into v_n
  from get_available_slots(c_tenant, array[c_cut], v_date, c_sara) s
  where s.starts_at = pg_temp.ts_at(v_date, '15:00');
  assert v_n = 1, 'الوقت الملغى لم يعد للمتاح';

  ---------------------------------------------------------------
  raise notice 'اختبار 10: التقييم — فقط للحجوزات المكتملة وبنسب صحيحة';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    insert into reviews (booking_id, rating, comment) values (v_b2, 5, 'رائع'); -- غير مكتمل
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'تقييم حجز غير مكتمل مرّ!';

  insert into reviews (booking_id, rating, comment) values (v_b1, 5, 'خدمة ممتازة');
  select count(*) into v_n from reviews r
  where r.booking_id = v_b1 and r.customer_id = c_amal
    and r.staff_id = c_sara and r.tenant_id = c_tenant and r.is_published = false;
  assert v_n = 1, 'التقييم لم يرث بيانات الحجز';

  ---------------------------------------------------------------
  raise notice 'اختبار 11: النقاط — الدفتر يحدّث الرصيد';
  ---------------------------------------------------------------
  select points_balance into v_base_n from customers where id = c_amal;
  insert into loyalty_transactions (tenant_id, customer_id, points, reason, booking_id)
  values (c_tenant, c_amal, 120, 'visit', v_b1);
  select points_balance into v_n from customers where id = c_amal;
  assert v_n = v_base_n + 120, 'رصيد النقاط لم يتحدث: ' || v_n || ' (الأساس ' || v_base_n || ')';

  ---------------------------------------------------------------
  raise notice 'اختبار 12: عزل الصالونات — لا ربط بين صالونين';
  ---------------------------------------------------------------
  v_failed := false;
  begin
    -- صالون وهمي ثانٍ يحاول حجزًا بعميلة الصالون الأول
    insert into tenants (id, slug, name) values
      ('99999999-9999-9999-9999-999999999999', 'other', 'صالون آخر');
    insert into bookings (tenant_id, customer_id, staff_id, status, starts_at, ends_at)
    values ('99999999-9999-9999-9999-999999999999', c_amal, c_sara, 'confirmed',
            pg_temp.ts_at(v_date, '20:00'), pg_temp.ts_at(v_date, '21:00'));
  exception when foreign_key_violation then
    v_failed := true;
  end;
  assert v_failed, 'ربط بيانات بين صالونين مرّ — ثغرة عزل!';

  raise notice '✅ نجحت الاختبارات الاثنا عشر كلها';
end;
$$;

rollback;
