# 🐾 Nana — پلتفرم حیوانات گمشده

<div align="center">

![Nana Banner](https://img.shields.io/badge/نانا-پلتفرم%20حیوانات%20گمشده-FF6B9D?style=for-the-badge&logo=paw&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=flat-square&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**پلتفرم آنلاین برای ثبت، جستجو و ردیابی حیوانات گمشده و پیدا شده**

[دمو زنده](#) · [API Docs](#api-docs) · [گزارش باگ](https://github.com/Pouyazadmehr83/Nana/issues)

</div>

---

## ✨ امکانات

| ویژگی | توضیح |
|-------|--------|
| 🔐 **احراز هویت JWT** | ثبت‌نام و ورود با شماره موبایل + auto-refresh token |
| 🐾 **مدیریت آگهی** | ثبت، ویرایش، حذف آگهی گمشده/پیدا شده |
| 🗺️ **نقشه تعاملی** | انتخاب مختصات روی Leaflet Map + نمایش همه آگهی‌ها روی نقشه |
| 👁️ **گزارش مشاهده** | کاربران می‌توانند محل دیده‌شدن حیوان را با مختصات ثبت کنند |
| 🎉 **پیدا کردم!** | باتن ویژه با اعتبارسنجی + نمایش شماره صاحب برای تماس |
| 🔍 **جستجو و فیلتر** | جستجوی متنی + فیلتر نوع/شهر/وضعیت |
| 📷 **آپلود تصویر** | پردازش آسنکرون با Celery + فشرده‌سازی با Pillow |
| ⚡ **کشینگ Redis** | کشینگ هوشمند لیست آگهی‌ها + invalidation خودکار |
| 🐳 **Docker Ready** | یک دستور برای راه‌اندازی کامل |

---

## 🛠️ تکنولوژی‌ها

### Backend
- **Django 5** + **Django REST Framework**
- **SimpleJWT** — احراز هویت JWT
- **Celery** + **Redis** — پردازش آسنکرون تصاویر
- **PostgreSQL 16** — پایگاه داده
- **Gunicorn** + **Nginx** — سرور production
- **Pillow** — پردازش و فشرده‌سازی تصاویر

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** — routing
- **Leaflet** + **React-Leaflet** — نقشه تعاملی
- **Axios** — HTTP client با interceptor JWT
- **Vazirmatn** — فونت فارسی

---

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- Docker & Docker Compose
- Node.js 18+
- Git

### ۱. کلون پروژه
```bash
git clone https://github.com/Pouyazadmehr83/Nana.git
cd Nana
```

### ۲. تنظیم محیط
```bash
cp .env.example .env
# فایل .env را ویرایش کنید و مقادیر مورد نیاز را تنظیم کنید
```

```env
# .env
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

DB_NAME=nana_db
DB_USER=nana_user
DB_PASSWORD=strong_password
DB_HOST=db
DB_PORT=5432

REDIS_HOST=redis
REDIS_PORT=6379
```

### ۳. راه‌اندازی بک‌اند با Docker
```bash
docker compose up -d --build
```

پس از چند دقیقه، سرویس‌ها آماده هستند:

| سرویس | آدرس |
|--------|------|
| API | http://localhost:8000 |
| Admin | http://localhost:8000/admin |
| Swagger | http://localhost:8000/api/docs/swagger/ |
| ReDoc | http://localhost:8000/api/docs/redoc/ |

### ۴. راه‌اندازی فرانت‌اند
```bash
cd frontend
npm install
cp .env.example .env        # یا: echo "VITE_API_BASE=http://localhost:8000" > .env
npm run dev
```

فرانت‌اند روی **http://localhost:5173** در دسترس است.

---

## 📖 API Docs

### Authentication

| Method | Endpoint | توضیح |
|--------|----------|--------|
| `POST` | `/api/v1/auth/register/` | ثبت‌نام کاربر جدید |
| `POST` | `/api/v1/auth/token/` | ورود — دریافت JWT |
| `POST` | `/api/v1/auth/token/refresh/` | تجدید access token |
| `POST` | `/api/v1/auth/token/blacklist/` | خروج — blacklist refresh |
| `GET`  | `/api/v1/auth/me/` | پروفایل کاربر جاری |
| `PATCH`| `/api/v1/auth/me/` | ویرایش پروفایل |

### Pet Reports

| Method | Endpoint | توضیح |
|--------|----------|--------|
| `GET`  | `/api/v1/pets/reports/` | لیست آگهی‌ها (فیلتر + صفحه‌بندی) |
| `POST` | `/api/v1/pets/reports/` | ثبت آگهی جدید |
| `GET`  | `/api/v1/pets/reports/{id}/` | جزئیات آگهی |
| `PATCH`| `/api/v1/pets/reports/{id}/` | ویرایش آگهی |
| `DELETE`|`/api/v1/pets/reports/{id}/` | حذف آگهی |
| `GET`  | `/api/v1/pets/reports/my_reports/` | آگهی‌های من |
| `POST` | `/api/v1/pets/reports/{id}/toggle_resolved/` | تغییر وضعیت پیدا شد |
| `POST` | `/api/v1/pets/reports/{id}/upload_image/` | آپلود تصویر |

### Query Parameters (GET /reports/)
```
?search=        جستجوی متنی
?report_type=   LOST | FOUND
?pet_type=      DOG | CAT | BIRD | OTHER
?city=          نام شهر
?page=          شماره صفحه
?page_size=     تعداد در هر صفحه (پیش‌فرض: 12)
```

### Sightings

| Method | Endpoint | توضیح |
|--------|----------|--------|
| `GET`  | `/api/v1/pets/sightings/` | لیست گزارش‌های مشاهده |
| `POST` | `/api/v1/pets/sightings/` | ثبت گزارش مشاهده |

---

## 🗂️ ساختار پروژه

```
nana/
├── 🐍 Backend (Django)
│   ├── accounts/           # احراز هویت و پروفایل
│   ├── pets/               # مدل‌ها، views، tasks
│   │   ├── models.py       # PetReport, PetImage, Sighting
│   │   ├── views.py        # ViewSets
│   │   ├── serializers.py  # DRF Serializers
│   │   ├── caching.py      # Redis caching logic
│   │   ├── signals.py      # Cache invalidation
│   │   └── tasks.py        # Celery image processing
│   ├── config/             # Settings, URLs, WSGI
│   ├── nginx/              # Nginx config
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── entrypoint.sh
│
└── 🌸 Frontend (React)
    └── frontend/src/
        ├── components/     # Navbar, PetCard, Modals
        ├── contexts/       # AuthContext (JWT)
        ├── pages/          # Home, Detail, Create, Edit, Map...
        ├── services/       # api.ts (Axios)
        └── types/          # TypeScript types
```

---

## 🤝 مشارکت

1. Fork کنید
2. Branch بسازید: `git checkout -b feature/amazing-feature`
3. Commit کنید: `git commit -m 'feat: add amazing feature'`
4. Push کنید: `git push origin feature/amazing-feature`
5. Pull Request باز کنید

---

## 📄 لایسنس

MIT License — برای استفاده، تغییر و توزیع آزاد است.

---

<div align="center">
ساخته‌شده با ❤️ برای کمک به پیدا کردن حیوانات گمشده 🐾
</div>
