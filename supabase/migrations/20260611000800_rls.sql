-- ============================================================
-- عزل البيانات: Row Level Security على كل الجداول
--
-- النموذج:
--  * مالك المنصة (platform_admins): وصول كامل لكل شيء
--  * فريق الصالون: وصول لبيانات صالونه فقط حسب دوره
--  * العميلة: صفّها وحجوزاتها ونقاطها فقط
--  * الزائر (anon): قراءة عامة لما تعرضه صفحة الصالون فقط
--
-- ملاحظة معمارية: إنشاء الحجوزات من واجهة العميلة لا يتم بـ insert مباشر،
-- بل عبر RPC ذرّي (المرحلة 1: create_booking) يتحقق من التوفر والأسعار
-- والأقفال داخل معاملة واحدة. لذلك لا توجد سياسة insert للعميلات على bookings.
-- ============================================================

-- حجوزات/بيانات المستخدمة الحالية — security definer لتفادي recursion داخل السياسات
create or replace function public.my_customer_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from customers where user_id = auth.uid();
$$;

create or replace function public.my_staff_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from staff where user_id = auth.uid();
$$;

-- تفعيل RLS + سياسة مالك المنصة الشاملة على كل جداول public
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy super_admin_all on public.%I for all using (is_super_admin()) with check (is_super_admin())', t);
  end loop;
end;
$$;

-- ---------- طبقة المنصة ----------
create policy plans_public_read on plans
  for select using (is_active);

create policy tenants_public_read on tenants
  for select using (status in ('trial','active')); -- صفحات الصالونات العامة

create policy tenants_owner_update on tenants
  for update using (has_tenant_role(id, array['owner']::tenant_role[]));

create policy subscriptions_owner_read on subscriptions
  for select using (has_tenant_role(tenant_id, array['owner']::tenant_role[]));

create policy members_read on tenant_members
  for select using (user_id = auth.uid() or is_tenant_admin(tenant_id));
create policy members_admin_insert on tenant_members
  for insert with check (is_tenant_admin(tenant_id));
create policy members_admin_update on tenant_members
  for update using (is_tenant_admin(tenant_id));
create policy members_admin_delete on tenant_members
  for delete using (is_tenant_admin(tenant_id));

-- ---------- نواة الصالون ----------
create policy branches_public_read on branches
  for select using (is_active);
create policy branches_admin_all on branches
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy settings_member_read on tenant_settings
  for select using (is_tenant_member(tenant_id));
create policy settings_admin_all on tenant_settings
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy categories_public_read on categories
  for select using (is_active);
create policy categories_admin_all on categories
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy services_public_read on services
  for select using (is_active);
create policy services_admin_all on services
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy staff_public_read on staff
  for select using (is_active and is_bookable); -- مسار الحجز يعرض الموظفات
create policy staff_member_read on staff
  for select using (is_tenant_member(tenant_id));
create policy staff_admin_all on staff
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

-- مسار الحجز يحتاج معرفة خدمات كل موظفة (المعرّفات وحدها لا تكشف شيئًا)
create policy staff_services_public_read on staff_services
  for select using (true);
create policy staff_services_admin_all on staff_services
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

-- الجداول لا تُعرض للعموم — التوفر يُحسب عبر RPC في المرحلة 1
create policy schedules_member_read on staff_schedules
  for select using (is_tenant_member(tenant_id));
create policy schedules_admin_all on staff_schedules
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy time_off_staff_read on staff_time_off
  for select using (staff_id in (select my_staff_ids()));
create policy time_off_staff_request on staff_time_off
  for insert with check (staff_id in (select my_staff_ids()) and status = 'pending');
create policy time_off_admin_all on staff_time_off
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

-- ---------- CRM ----------
-- الموظفات يقرأن قاعدة العملاء (لملف الجمال قبل الموعد)، والكتابة للإدارة والاستقبال
create policy customers_member_read on customers
  for select using (is_tenant_member(tenant_id));
create policy customers_desk_all on customers
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
-- العميلة: صفّها فقط (تريغر protect_customer_fields يمنع تعديل النقاط/المحفظة)
create policy customers_self_read on customers
  for select using (user_id = auth.uid());
create policy customers_self_update on customers
  for update using (user_id = auth.uid());
create policy customers_self_insert on customers
  for insert with check (user_id = auth.uid());

create policy tags_desk_all on customer_tags
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy tag_links_desk_all on customer_tag_links
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));

-- ملاحظات داخلية: للإدارة فقط — العميلة لا تراها أبدًا
create policy notes_desk_all on customer_notes
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));

-- ---------- الحجوزات ----------
create policy bookings_desk_all on bookings
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy bookings_staff_read on bookings
  for select using (staff_id in (select my_staff_ids()));
create policy bookings_staff_update on bookings -- بدء/إنهاء الخدمة من بوابة الموظفة
  for update using (staff_id in (select my_staff_ids()))
  with check (staff_id in (select my_staff_ids()));
create policy bookings_customer_read on bookings
  for select using (customer_id in (select my_customer_ids()));

-- عناصر الحجز تُرى إذا كان الحجز الأب مرئيًا (سياسات bookings تُطبق على الاستعلام الفرعي)
create policy booking_items_visible_read on booking_items
  for select using (exists (select 1 from bookings b where b.id = booking_id));
create policy booking_items_desk_write on booking_items
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));

create policy holds_desk_read on booking_holds
  for select using (is_tenant_desk(tenant_id)); -- الإنشاء عبر RPC فقط

create policy waitlist_desk_all on waitlist
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy waitlist_customer_read on waitlist
  for select using (customer_id in (select my_customer_ids()));
create policy waitlist_customer_insert on waitlist
  for insert with check (customer_id in (select my_customer_ids()));

-- ---------- الولاء والنمو ----------
create policy loyalty_desk_all on loyalty_transactions
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy loyalty_customer_read on loyalty_transactions
  for select using (customer_id in (select my_customer_ids()));

create policy gift_cards_desk_all on gift_cards
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy gift_cards_buyer_read on gift_cards
  for select using (buyer_customer_id in (select my_customer_ids()));

-- الكوبونات لا تُعرض للعموم — التحقق من الكود عبر RPC لاحقًا
create policy coupons_admin_all on coupons
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy redemptions_desk_all on coupon_redemptions
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy redemptions_customer_read on coupon_redemptions
  for select using (customer_id in (select my_customer_ids()));

create policy packages_public_read on packages
  for select using (is_active);
create policy packages_admin_all on packages
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy package_services_public_read on package_services
  for select using (true);
create policy package_services_admin_all on package_services
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

create policy customer_packages_desk_all on customer_packages
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy customer_packages_self_read on customer_packages
  for select using (customer_id in (select my_customer_ids()));

create policy referrals_desk_all on referrals
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy referrals_referrer_read on referrals
  for select using (referrer_id in (select my_customer_ids()));

create policy reviews_public_read on reviews
  for select using (is_published);
create policy reviews_admin_all on reviews
  for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy reviews_customer_read on reviews
  for select using (customer_id in (select my_customer_ids()));
create policy reviews_customer_insert on reviews
  for insert with check (customer_id in (select my_customer_ids()));

-- ---------- الواتساب ----------
create policy templates_desk_all on whatsapp_templates
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy campaigns_desk_all on campaigns
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
create policy messages_desk_all on whatsapp_messages
  for all using (is_tenant_desk(tenant_id)) with check (is_tenant_desk(tenant_id));
