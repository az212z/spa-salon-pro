-- ============================================================
-- معلومات عامة تحتاجها واجهة الزبائن قبل تسجيل الدخول
-- (إعدادات tenant_settings محمية بـ RLS للأعضاء فقط — هذا view
--  security definer مقصود يكشف الحقول الآمنة للعرض العام فقط)
-- ============================================================

create view tenant_public_info as
select t.id as tenant_id,
       t.slug,
       s.timezone,
       s.slot_granularity_minutes,
       s.deposit_mode,
       s.deposit_percent,
       s.cancellation_window_hours,
       s.allowed_payment_methods
from tenants t
join tenant_settings s on s.tenant_id = t.id
where t.status in ('trial','active');

grant select on tenant_public_info to anon, authenticated;
