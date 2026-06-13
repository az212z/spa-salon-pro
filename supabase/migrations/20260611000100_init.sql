-- ============================================================
-- المرحلة 0 — الامتدادات والأنواع المشتركة
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid
create extension if not exists btree_gist; -- قيد منع تعارض الحجوزات (EXCLUDE)
create extension if not exists citext;     -- نصوص غير حساسة لحالة الأحرف (slug، البريد)
create extension if not exists pg_trgm;    -- بحث ضبابي سريع في أسماء وجوالات العميلات (CRM)

-- حالات الصالون على المنصة
create type tenant_status as enum ('trial','active','suspended','cancelled');

-- حالة اشتراك الصالون
create type subscription_status as enum ('trialing','active','past_due','cancelled','expired');

-- أدوار فريق الصالون (العميلة ليست عضوًا — لها جدول customers)
create type tenant_role as enum ('owner','manager','receptionist','staff');

-- دورة حياة الحجز
create type booking_status as enum ('pending','confirmed','in_progress','completed','cancelled','no_show');
create type booking_source as enum ('online','phone','walk_in','manual');

-- الدفع
create type payment_status as enum ('unpaid','deposit_paid','paid','refunded','partially_refunded');
create type payment_method as enum ('mada','apple_pay','card','cash','wallet','gift_card');

-- الولاء
create type customer_tier as enum ('bronze','silver','gold','vip');
create type points_reason as enum ('visit','referral','signup','birthday','gift','redeem','adjust');

-- خصومات وهدايا ورسائل وإجازات
create type discount_type as enum ('percent','fixed');
create type gift_card_status as enum ('active','redeemed','expired','cancelled');
create type message_status as enum ('queued','sent','delivered','read','failed');
create type time_off_status as enum ('pending','approved','rejected');

-- تحديث updated_at تلقائيًا
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
