# پروژه Nana (Django REST Framework + PostgreSQL + Docker)

این پروژه شامل ساختار استاندارد جنگو (Django) همراه با Django REST Framework (DRF)، دیتابیس PostgreSQL و کانفیگ Docker و Docker Compose است.

---

## 🚀 نحوه راه‌اندازی با داکر (Docker)

### ۱. بیلد و اجرای کانتینرها:
```bash
docker compose up --build -d
```

### ۲. اعمال مایگریشن‌ها (Migrations):
```bash
docker compose exec web python manage.py migrate
```

### ۳. ساخت سوپریوزر (Superuser):
```bash
docker compose exec web python manage.py createsuperuser
```

---

## 🌐 آدرس‌ها و اندپوینت‌ها

- **Health Check API**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- **پنل ادمین (Django Admin)**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **احراز هویت DRF**: [http://localhost:8000/api-auth/login/](http://localhost:8000/api-auth/login/)

---

## 🛠 دستورات کاربردی

- **مشاهده لاگ‌ها**:
  ```bash
  docker compose logs -f
  ```
- **توقف کانتینرها**:
  ```bash
  docker compose down
  ```
- **ساخت اپ جدید در جنگو**:
  ```bash
  docker compose exec web python manage.py startapp <app_name>
  ```
- **دسترسی به ترمینال وب**:
  ```bash
  docker compose exec web bash
  ```
- **دسترسی به دیتابیس پُستگرس**:
  ```bash
  docker compose exec db psql -U nana_user -d nana_db
  ```
