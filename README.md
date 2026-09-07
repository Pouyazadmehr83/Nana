# 🐾 Nana — Distributed Pet Recovery & Sighting Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5.6-37814A?style=flat-square&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Nana** is an enterprise-grade, high-throughput RESTful backend engineered to report, search, and track lost and found pets across metropolitan regions. Designed with production resilience and scalability at its core, it integrates deterministic Redis query caching, asynchronous Celery media optimization pipelines, geospatial bounding-box queries, and hardened JWT authentication.

---

## 🏛️ System Architecture

```text
                           +------------------------+
                           |  Client / SPA Frontend |
                           +-----------+------------+
                                       |
                                       | HTTP / REST
                                       v
                     +------------------------------------+
                     |           Nginx 1.27               |
                     |  - Reverse Proxy                   |
                     |  - Static / Media Cache & Headers  |
                     |  - Rate Throttling & SSL Offload   |
                     +-----------------+------------------+
                                       |
                                       | Unix Socket / Internal TCP (8000)
                                       v
                     +------------------------------------+
                     |      Gunicorn + Django (DRF)       |
                     |  - Business Logic & REST Routing   |
                     |  - JWT Authentication & Validation |
                     |  - Signal-Driven Cache Control     |
                     +-------+--------------------+-------+
                             |                    |
            Cache Hit / Miss |                    | Async Image Tasks
                             v                    v
              +--------------------+       +--------------------+
              |   Redis (Key-Val)  |       |   Celery Worker    |
              |   - Query Cache    | <---> |   - Pillow Resize  |
              |   - Celery Broker  |       |   - Compression    |
              +--------------------+       +--------------------+
                             |
                             | Relational Queries & Transactions
                             v
              +-----------------------------------+
              |          PostgreSQL 16            |
              |   - ACID Transactions             |
              |   - Indexed Geo & Attribute Search|
              |   - Foreign Key Constraints       |
              +-----------------------------------+
```

---

## ⚡ Core Engineering Highlights

### 1. Deterministic Redis Query Caching & Signal-Driven Invalidation
* **Problem**: Public directory feeds incur heavy database read traffic under complex multi-variable filtering (pet type, gender, reward, city, dates). Conventional caching schemes suffer from key fragmentation when identical query parameters arrive in differing orders (e.g., `?city=Tehran&pet_type=DOG` vs `?pet_type=DOG&city=Tehran`).
* **Implementation**:
  * Implemented `get_normalized_cache_key` ([pets/caching.py](file:///home/pouyi/Desktop/nana/pets/caching.py)), which extracts all query parameters, alphabetically sorts keys and multi-values, standardizes the querystring, and calculates an MD5 digest.
  * Injected custom `X-Cache: HIT` and `X-Cache: MISS` diagnostic headers for transparent observability.
  * Utilized non-blocking Redis `SCAN` cursor iteration (`scan_iter`) inside `invalidate_pet_reports_cache` triggered by Django `post_save` and `post_delete` signals on `PetReport`, `PetImage`, and `Sighting` models. This purges only relevant cache keys without freezing the Redis instance or invalidating unrelated application state.

### 2. Asynchronous, Non-Blocking Media Processing Pipeline
* **Problem**: Synchronous client image uploads consume web worker threads during CPU-intensive operations (Lanczos resampling, EXIF rotation, color-profile conversion, quality quantization), precipitating server starvation.
* **Implementation**:
  * Offloaded post-upload transformations to dedicated Celery background workers via Redis broker ([pets/tasks.py](file:///home/pouyi/Desktop/nana/pets/tasks.py)).
  * The `optimize_pet_image` task handles color-space conversion (`RGBA`/`LA`/`P` to `RGB`), bounds maximum resolution to 1200px width using high-fidelity `LANCZOS` downsampling, and quantizes JPEG/WebP files to 80% quality with compression optimization.
  * Incorporates automatic cloud storage detection: if assets are hosted on external CDNs (such as Cloudinary), local disk processing is skipped in favor of edge transformation.

### 3. Trigonometric Geospatial Bounding-Box Filtering
* **Problem**: Users frequently require location-based searches around specific coordinates. Installing and maintaining PostGIS can introduce significant operational overhead and infrastructure requirements for lightweight projects.
* **Implementation**:
  * Built an analytical bounding-box query filter ([pets/filters.py](file:///home/pouyi/Desktop/nana/pets/filters.py)) approximating spherical Earth curvature (`deg_lat = radius / 111.0`, `deg_lng = radius / (111.0 * cos(lat))`).
  * Queries leverage database composite indexes on `(latitude, longitude)`, eliminating sequential table scans while sustaining millisecond execution times.

### 4. Zero-Downtime Migration & Hybrid Identifier Architecture
* **Problem**: Transitioning legacy sequential integer primary keys (`id`) to distributed UUIDs without breaking active third-party client integrations or foreign key relationships.
* **Implementation**:
  * Integrated a dual-lookup resolution strategy in `PetReportViewSet` ([pets/views.py](file:///home/pouyi/Desktop/nana/pets/views.py)), allowing records to be fetched seamlessly via RFC 4122 UUID or numeric legacy identifier.
  * Avoided N+1 database queries via optimized `select_related("user")` and `prefetch_related("images", "sightings__user")` querysets.

### 5. Defensive Security & Data Sanitization
* **Authentication**: Stateless JSON Web Tokens (JWT) powered by `djangorestframework-simplejwt`, enforced with rotating refresh tokens and database blacklist tracking on user logout.
* **Brute-Force Mitigation**: Scoped rate-limiting throttles (`ScopedRateThrottle`) safeguarding authentication endpoints (`20/minute`) alongside tiered anonymous/authenticated policies (`120/min` and `1000/min`).
* **Input Normalization**: Deep input sanitization transforming localized Eastern Arabic and Persian numerals (`۰-۹` / `٠-٩`) to standard ASCII digits across all phone, authentication, and coordinate inputs.
* **Container Isolation**: Multi-stage Docker execution under an unprivileged `appuser` (UID 1000), preventing root escalation vectors inside container runtimes.

---

## 📑 Interactive API Documentation

Interactive OpenAPI 3.0 documentation is auto-generated and served via Swagger UI and ReDoc:

* **Swagger UI**: `http://localhost:8000/api/docs/swagger/`
* **ReDoc**: `http://localhost:8000/api/docs/redoc/`
* **Raw OpenAPI Schema**: `http://localhost:8000/api/schema/`
* **Service Health Check**: `http://localhost:8000/api/health/`

### Primary Endpoint Overview

| Module | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Auth** | `POST` | `/api/v1/auth/register/` | Register new user account | No |
| **Auth** | `POST` | `/api/v1/auth/token/` | Obtain JWT access & refresh token pair | No |
| **Auth** | `POST` | `/api/v1/auth/token/refresh/` | Refresh access token | No |
| **Auth** | `POST` | `/api/v1/auth/token/blacklist/` | Invalidate/blacklist refresh token on logout | Yes |
| **Auth** | `GET` / `PATCH` | `/api/v1/auth/me/` | Retrieve or update current user profile | Yes |
| **Pets** | `GET` | `/api/v1/pets/reports/` | List/filter pet reports (Redis cached, paginated) | No |
| **Pets** | `POST` | `/api/v1/pets/reports/` | Create a new lost/found pet report | Yes |
| **Pets** | `GET` | `/api/v1/pets/reports/{uuid}/` | Retrieve detailed report & sighting history | No |
| **Pets** | `PATCH` / `DELETE`| `/api/v1/pets/reports/{uuid}/` | Update or remove report (Owner only) | Yes |
| **Pets** | `POST` | `/api/v1/pets/reports/{id}/upload_image/` | Upload image (triggers async Celery worker) | Yes |
| **Pets** | `POST` | `/api/v1/pets/reports/{id}/toggle_resolved/` | Toggle resolved status (case closed) | Yes |
| **Sightings**| `GET` | `/api/v1/pets/sightings/` | List reported sightings (filter by `report`) | No |
| **Sightings**| `POST`| `/api/v1/pets/sightings/` | Submit a community sighting with coordinates | Yes |

---

## 🚀 Local Development & Docker Setup

### Prerequisites
* **Docker Engine** (>= 24.0) & **Docker Compose** (>= 2.20)
* **Git**

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Pouyazadmehr83/Nana.git
   cd Nana
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   > Customize values in `.env` if needed. Default values in `.env.example` are pre-configured to run out of the box with the provided Docker Compose network.

3. **Build and Launch Containerized Services**
   ```bash
   docker compose up -d --build
   ```

4. **Verify Service Health**
   ```bash
   docker compose ps
   ```
   All five services (`nana_postgres`, `nana_redis`, `nana_django`, `nana_celery`, and `nana_nginx`) will initialize, with automated database migrations and static collection executed before Gunicorn spawns.

5. **Create a Superuser (Optional)**
   ```bash
   docker compose exec web python manage.py createsuperuser
   ```

6. **Access Application Services**
   * **API Gateway (Nginx)**: [http://localhost](http://localhost)
   * **Direct Django Application**: [http://localhost:8000](http://localhost:8000)
   * **Admin Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)
   * **Swagger API Explorer**: [http://localhost:8000/api/docs/swagger/](http://localhost:8000/api/docs/swagger/)

7. **Stopping Services**
   ```bash
   docker compose down
   # To purge data volumes as well:
   docker compose down -v
   ```

---

## 🧪 Test Suite Execution

The repository maintains an automated test suite covering authentication constraints, JWT life-cycles, model validations, query caching behavior, and view permissions.

### Running Tests via Docker
```bash
# Execute entire test suite
docker compose exec web python manage.py test

# Execute test suite with verbosity
docker compose exec web python manage.py test -v 2

# Test individual applications
docker compose exec web python manage.py test accounts
docker compose exec web python manage.py test pets
```

### Running Tests Locally (Virtual Environment)
```bash
# Initialize and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations and tests using SQLite/local PostgreSQL
python manage.py test
```

---

## 🗂️ Project Layout

```text
nana/
├── accounts/                   # Authentication & User Management App
│   ├── models.py               # CustomUser with Iranian phone regex & null-safe email
│   ├── serializers.py          # Registration, JWT token & profile serializers
│   ├── views.py                # Throttled registration & profile viewsets
│   ├── urls.py                 # JWT pair, refresh, blacklist & profile routes
│   └── tests.py                # User model & auth unit/integration tests
├── pets/                       # Pet Directory & Geospatial Recovery App
│   ├── models.py               # PetReport (UUID-indexed), PetImage, Sighting
│   ├── views.py                # PetReportViewSet & SightingViewSet with caching
│   ├── serializers.py          # Nested report, image, and sighting serializers
│   ├── filters.py              # Advanced FilterSet & Bounding-Box geo-radius
│   ├── caching.py              # Normalized MD5 key generation & Redis SCAN invalidation
│   ├── signals.py              # Model lifecycle hooks for automated cache clearance
│   ├── tasks.py                # Celery async image resizing & Pillow optimization
│   ├── permissions.py          # IsOwnerOrReadOnly object-level permission guards
│   └── tests.py                # Comprehensive test suite for directory & caching
├── config/                     # Core Django Configuration Root
│   ├── settings.py             # Hardened settings (env-driven security, CORS, DRF)
│   ├── urls.py                 # Root routing, OpenAPI schemas, and health checks
│   ├── celery.py               # Celery application initialization & task autodiscovery
│   ├── wsgi.py                 # WSGI application entry point
│   └── asgi.py                 # ASGI application entry point
├── frontend/                   # Single Page Application (React 18 + Vite + TypeScript)
│   ├── src/                    # Components, pages, contexts, Leaflet map integration
│   ├── package.json            # Node.js dependencies
│   └── .env.example            # Frontend environment variable configuration
├── nginx/                      # Production Reverse Proxy Configuration
│   └── default.conf            # Nginx upstream, compression, and security headers
├── Dockerfile                  # Multi-layer Dockerfile running unprivileged appuser
├── docker-compose.yml          # Orchestration: Web, Celery, Postgres, Redis, Nginx
├── entrypoint.sh               # Startup script: migrations, static collection, gunicorn
├── requirements.txt            # Production-only pinned Python dependencies
├── .env.example                # Documented configuration template
└── README.md                   # Project documentation
```

---

## 🛡️ Security & Compliance Policies

* **Production Secret Isolation**: All sensitive credentials (`SECRET_KEY`, database credentials, storage keys) are strictly parsed from environment variables.
* **Fail-Safe Startup**: If `DEBUG=False` and a standard placeholder `SECRET_KEY` is detected, the server immediately halts startup via `ImproperlyConfigured`.
* **Safe Host Whitelisting**: `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` reject unauthenticated wildcard access in production environments.
* **Defensive HTTP Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `server_tokens off` across both Nginx and Django layers.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).
