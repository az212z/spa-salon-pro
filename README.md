# ✦ Spa & Salon Pro — منصة حجوزات وإدارة الصالونات والسبا

**Spa & Salon Pro** منصة سحابية عربية (RTL) فاخرة لإدارة وحجوزات الصالونات والسبا:
كل صالون يشترك يحصل على نظامه المستقل بهويته وألوانه ورابطه الخاص
(`salon.spasalonpro.com`)، مع عزل تام للبيانات، ولوحة عليا لمالك المنصة
يدير منها الصالونات والاشتراكات.

> نظام حجوزات لحظي بلا تعارض · قاعدة عملاء وملف جمال · تذكيرات واتساب ·
> ولاء وهدايا · تصميم فاخر بخط El Messiri وهوية وردية ذهبية.

## 🌐 النسخة الحيّة

| الصفحة | الرابط |
|---|---|
| المنصة | **https://spa-salon-pro.vercel.app** |
| صالون تجريبي (لمسة) | https://spa-salon-pro.vercel.app/s/demo |
| الحجز | https://spa-salon-pro.vercel.app/s/demo/book |
| لوحة الإدارة | https://spa-salon-pro.vercel.app/s/demo/admin |

مستضاف على **Vercel** + **Supabase سحابي** (Frankfurt). الدخول للإدارة برمز OTP
يصل على بريد المالك المسجّل.

## التقنيات

| المكوّن | الاختيار |
|---|---|
| الواجهة | Next.js (App Router) + Tailwind CSS + shadcn/ui |
| قاعدة البيانات والمصادقة | Supabase (PostgreSQL + Auth + Realtime + Storage) مع RLS |
| الإشعارات | WhatsApp Business Cloud API (عبر Make.com) |
| المدفوعات | Moyasar / Tap — مدى وApple Pay |
| النشر | Vercel مع Wildcard Subdomains |

## بنية المشروع

```
spa-salon-pro/
├── supabase/
│   ├── config.toml
│   ├── migrations/        # مخطط قاعدة البيانات كاملًا (المرحلة 0)
│   │   ├── ..._init.sql          # الامتدادات والأنواع
│   │   ├── ..._platform.sql      # المنصة: الصالونات والخطط والاشتراكات
│   │   ├── ..._salon_core.sql    # الفروع والخدمات والموظفات والجداول
│   │   ├── ..._crm.sql           # قاعدة العملاء وملف الجمال والوسوم
│   │   ├── ..._bookings.sql      # محرك الحجوزات + منع التعارض
│   │   ├── ..._growth.sql        # الولاء والهدايا والكوبونات والباقات
│   │   ├── ..._messaging.sql     # قوالب الواتساب والحملات
│   │   ├── ..._rls.sql           # سياسات عزل البيانات كاملة
│   │   ├── ..._plans_seed.sql    # خطط الاشتراك الثلاث
│   │   └── ..._booking_engine.sql # المرحلة 1: التوفر والحجز الذرّي والإلغاء
│   ├── tests/
│   │   └── booking_engine_test.sql # 12 اختبارًا لمحرك الحجوزات
│   └── seed.sql           # صالون تجريبي للتطوير المحلي
└── docs/
    └── database.md        # شرح المخطط والقرارات التصميمية
```

## التشغيل المحلي

```bash
# 1) مثبت مسبقًا: Supabase CLI + colima (محرك Docker خفيف بدل Docker Desktop)
colima start          # مرة واحدة بعد كل إعادة تشغيل للجهاز

# 2) شغّل حزمة Supabase المحلية
cd spa-salon-pro
supabase start

# 3) طبّق المخطط + البيانات التجريبية (صالون لمسة demo)
supabase db reset

# 4) شغّل اختبارات محرك الحجوزات (12 اختبارًا)
docker exec -i supabase_db_salon-saas psql -U postgres -d postgres \
  < supabase/tests/booking_engine_test.sql

# 5) شغّل الواجهة
npm run dev
# المنصة:        http://localhost:3000
# صالون لمسة:    http://demo.localhost:3000  (أو /s/demo)
# لوحة الإدارة:  http://demo.localhost:3000/admin — دخول: admin@lamsa.demo
# رسائل OTP محليًا تصل إلى Mailpit: http://127.0.0.1:54324
```

للربط بمشروع سحابي حقيقي:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## النشر الحيّ (Vercel + Supabase سحابي)

> ⚠️ هذا تطبيق Next.js كامل (مكوّنات خادم + middleware + قاعدة بيانات) — **لا يعمل على
> GitHub Pages** التي تخدم ملفات ثابتة فقط. منصة النشر الصحيحة هي **Vercel**.

1. **أنشئ مشروع Supabase سحابي** على [supabase.com](https://supabase.com)، ثم ادفع المخطط:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   docker exec ... < supabase/seed.sql   # أو شغّل seed على السحابة لصالون تجريبي
   ```
2. **اربط المستودع بـ Vercel** ([vercel.com/new](https://vercel.com/new)) واستورد `az212z/spa-salon-pro`.
3. **أضف متغيرات البيئة** في Vercel:
   | المتغير | القيمة |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase السحابي |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح anon من Supabase |
   | `NEXT_PUBLIC_ROOT_DOMAIN` | نطاقك، مثل `spasalonpro.com` |
4. **فعّل Wildcard Subdomains** (`*.spasalonpro.com`) ليحصل كل صالون على رابطه الفرعي.
5. Vercel يبني وينشر تلقائيًا عند كل دفع — وملف `.github/workflows/ci.yml` يفحص lint والبناء أولًا.

أو عبر سطر الأوامر: `vercel` ثم `vercel --prod` (يتطلب تسجيل دخول حسابك على Vercel).

## خطة البناء

- [x] **المرحلة 0** — مخطط قاعدة البيانات متعدد المستأجرين + RLS + الأدوار ✅
- [x] **المرحلة 1** — محرك الحجوزات (الأوقات المتاحة + الحجز الذرّي + 12 اختبارًا) ⭐ ✅
- [x] **المرحلة 0ب** — Next.js 16 + Subdomain ديناميكي (demo.localhost → الصالون) ✅
- [x] **المرحلة 2 (النواة)** — صفحة الصالون بهويته + مسار الحجز 4 خطوات + دخول OTP + حسابي (الحجوزات، الإلغاء، النقاط والمستوى) ✅
- [x] **المرحلة 3 (النواة)** — لوحة الإدارة: لوحة اليوم بالإحصائيات، تقويم Timeline للموظفات بتحديث لحظي، تغيير حالات الحجز، الحجز اليدوي، CRM (بحث، شرائح ذكية، ملف تفصيلي، وسوم، ملاحظات داخلية، إهداء نقاط، ملف الجمال) ✅
- [ ] المرحلة 2 (تكملة) — إعادة الحجز بضغطة، التقييم بعد الزيارة، الهدايا والإحالة في الملف الشخصي
- [ ] المرحلة 3 (تكملة) — CRUD الخدمات والموظفات وجداولهن، الإعدادات، استيراد/تصدير العملاء، سحب وإفلات في التقويم
- [ ] المرحلة 3 — لوحة إدارة الصالون + CRM الكامل
- [ ] المرحلة 4 — بوابة الموظفات
- [ ] المرحلة 5 — الواتساب والأتمتة (الرسائل الست + الحملات)
- [ ] المرحلة 6 — الولاء والهدايا والعروض
- [ ] المرحلة 7 — طبقة SaaS: لوحة المنصة + الفوترة + النشر

## نموذج الربح

| الخطة | شهريًا | تشمل |
|---|---|---|
| الأساسية | 299 ر.س | الحجوزات + CRM + موظفتان + تذكيرات واتساب |
| الاحترافية | 599 ر.س | + الولاء + الهدايا + موظفات بلا حد + الحملات |
| المتقدمة | 999 ر.س | + فروع متعددة + دومين خاص + تقارير متقدمة |

تجربة مجانية 14 يوم لكل صالون جديد (مدمجة في `tenants.trial_ends_at`).
