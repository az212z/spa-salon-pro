-- ============================================================
-- خطط الاشتراك الثلاث (تُطبق في كل البيئات بما فيها الإنتاج)
-- ============================================================

insert into plans (code, name, name_en, price_monthly, price_yearly, features, limits, sort) values
(
  'basic', 'الأساسية', 'Basic', 299, 2990,
  '{"bookings":true,"crm":true,"whatsapp_reminders":true,"loyalty":false,"gift_cards":false,"referrals":false,"campaigns":false,"online_payment":true,"custom_domain":false,"advanced_reports":false,"priority_support":false}',
  '{"max_staff":2,"max_branches":1}',
  1
),
(
  'pro', 'الاحترافية', 'Pro', 599, 5990,
  '{"bookings":true,"crm":true,"whatsapp_reminders":true,"loyalty":true,"gift_cards":true,"referrals":true,"campaigns":true,"online_payment":true,"custom_domain":false,"advanced_reports":false,"priority_support":false}',
  '{"max_staff":null,"max_branches":1}',
  2
),
(
  'advanced', 'المتقدمة', 'Advanced', 999, 9990,
  '{"bookings":true,"crm":true,"whatsapp_reminders":true,"loyalty":true,"gift_cards":true,"referrals":true,"campaigns":true,"online_payment":true,"custom_domain":true,"advanced_reports":true,"priority_support":true}',
  '{"max_staff":null,"max_branches":null}',
  3
)
on conflict (code) do nothing;
