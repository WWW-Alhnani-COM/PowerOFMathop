This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
![Power of Math Banner](public/images/banner.png)

# Power of Math

## نبذة عن المشروع

**Power of Math** هو منصة تعليمية تفاعلية تهدف إلى تعزيز مهارات الرياضيات لدى الطلاب من خلال تحديات، اختبارات، تقارير أداء، ونظام مكافآت متكامل. تم تطوير المنصة بالكامل من الصفر بواسطة المهندس **محمد الحناني**، حيث قام بتصميم وتطوير جميع أجزاء المشروع: الواجهة الأمامية (Front-End)، الواجهة الخلفية (Back-End & API)، وقواعد البيانات.

---

## صور من المنصة

### الصفحة الرئيسية
![Home Page](public/images/screenshots/home.png)

### لوحة التحكم
![Dashboard](public/images/screenshots/dashboard.png)

### نافذة التحديات
![Challenge Window](public/images/screenshots/challenge.png)

> **ملاحظة:** يمكنك إضافة صورك الخاصة في مجلد `public/images/screenshots/` وتغيير الروابط أعلاه.

---

## المميزات الرئيسية

- نظام تسجيل دخول وتوثيق آمن
- تحديات رياضية تفاعلية مع نظام نقاط ومكافآت
- تقارير أداء مفصلة لكل طالب
- نظام توصيات ذكي باستخدام الذكاء الاصطناعي
- دعم تعدد المستويات والصفوف
- واجهة مستخدم حديثة وسهلة الاستخدام
- دعم كامل للغة العربية
- نظام إشعارات وتنبيهات
- تكامل مع قواعد بيانات قوية
- بنية برمجية قابلة للتوسع والصيانة

---

## التقنيات المستخدمة

- **Front-End:** Next.js, React, Tailwind CSS
- **Back-End & API:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (عبر Supabase)
- **Authentication:** Supabase Auth
- **State Management:** React Context API
- **Other:** ESLint, PostCSS, PNPM, GitHub Actions

---

## طريقة التشغيل محليًا

1. **استنساخ المستودع:**
	```bash
	git clone https://github.com/username/powerofmath-next.git
	cd powerofmath-next
	```
2. **تثبيت الحزم:**
	```bash
	pnpm install
	```
3. **إعداد متغيرات البيئة:**
	- أنشئ ملف `.env.local` وأضف بيانات الربط مع Supabase وبيانات البيئة الأخرى.
4. **تشغيل التطبيق:**
	```bash
	pnpm dev
	```
5. **زيارة التطبيق:**
	- افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

---

## هيكلية المشروع

```
├── actions/              # جميع الأكشنز الخاصة بالمنصة
├── components/           # مكونات الواجهة الأمامية
├── lib/                  # المكتبات والدوال المساعدة
├── public/               # الملفات العامة (صور، خطوط، ...)
├── src/                  # ملفات المصدر (صفحات، API، ...)
├── styles/               # ملفات الأنماط (CSS)
├── utils/                # دوال مساعدة إضافية
├── package.json          # إعدادات المشروع والحزم
└── README.md             # هذا الملف
```

---

## شكر وتقدير

تم تطوير هذا المشروع بالكامل بواسطة المهندس **محمد الحناني**، بدءًا من الفكرة، التصميم، البرمجة، إعداد قواعد البيانات، التكامل مع الخدمات السحابية، حتى الإطلاق النهائي.

للتواصل والاستفسار:
- [LinkedIn](https://www.linkedin.com/in/mohammed-alhanani)
- [البريد الإلكتروني](mailto:your.email@example.com)

---

## رخصة الاستخدام

هذا المشروع مفتوح المصدر ومتاح للاستخدام وفقًا لرخصة MIT.

---

**جميع الحقوق محفوظة © محمد الحناني 2026**
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
