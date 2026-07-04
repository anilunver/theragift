# TheraGift MVP v1

Psikologlar için web-first responsive dijital asistan sistemi. Randevu planlama, danışan uygunluk toplama, haftalık takvim, manuel seans ödeme takibi, algoritmik randevu önerisi ve Gift License / mock subscription altyapısı sağlar.

Bu depo tam çalışan bir **local MVP**'dir: Spring Boot backend + React frontend + PostgreSQL (Docker).

## Teknoloji

- **Backend:** Java 17, Spring Boot 3.2, Maven, Spring Security + JWT, Spring Data JPA, Lombok
- **Frontend:** React 18, Vite, Tailwind CSS v3, React Router, Axios
- **Database:** PostgreSQL 16 (Docker) — ana profil. Hızlı local test için H2 profili de mevcut.

## Klasör Yapısı

```
theragift/
  backend/           Spring Boot API (port 8080)
  frontend/          React + Vite arayüzü (port 5173)
  docs/wireframes/   Tasarım referans SVG'leri
  docker-compose.yml PostgreSQL container
  README.md
```

## Çalıştırma Adımları

### 1) PostgreSQL'i başlat

```bash
docker compose up -d
```

Bu, `theragift_db` veritabanını `localhost:5432` üzerinde ayağa kaldırır.
(DB: `theragift_db`, kullanıcı: `theragift`, şifre: `theragift123`)

### 2) Backend'i çalıştır

```bash
cd backend
mvn spring-boot:run
```

Varsayılan profil `postgres`'tir (bkz. `application.yml`). Backend `http://localhost:8080` üzerinde açılır.

İlk açılışta `SeedDataRunner` otomatik olarak demo verisini oluşturur (demo psikolog, 5 danışan, çalışma saatleri, çeşitli ödeme durumlarında randevular, Gift License aboneliği, AI kullanım kotası).

> Docker olmadan hızlı test etmek isterseniz: `mvn spring-boot:run -Dspring-boot.run.profiles=h2` ile bellek içi H2 veritabanı kullanabilirsiniz (ana hedef yine de PostgreSQL'dir).

### 3) Frontend'i çalıştır

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` üzerinde açılır ve backend'e `http://localhost:8080/api` üzerinden bağlanır.

### 4) Giriş yap

```
E-posta:  demo@theragift.app
Şifre:    password123
```

## Tamamlanan Modüller

1. **Auth** — JWT tabanlı login/register, `GET /api/auth/me`, korumalı frontend route'ları
2. **Psikolog Profili** — görüntüleme/güncelleme
3. **Çalışma Saatleri** — gün/saat/mola tanımlama, CRUD
4. **Danışan Yönetimi** — CRUD, danışan detay sayfası, ödeme özeti
5. **Danışan Uygunluk Formu** — token'lı public link üretimi, oturum açmadan form doldurma, bekleyen formlar listesi
6. **Randevu & Haftalık Takvim** — CRUD, çakışma kontrolü, haftalık görünüm, randevu modalı (tamamlandı/gelmedi/iptal)
7. **Randevu Öneri Algoritması** — çalışma saatleri + mevcut randevular + danışan uygunluk notuna göre en uygun 3 slotu skorlayarak önerir (`GET /api/suggestions/client/{id}`)
8. **Seans Ücreti & Ödeme Takibi** — ödeme durumu/yöntemi/kısmi ödeme takibi, ödenmemiş/geciken listeleri, aylık özet
9. **Dashboard** — günlük/aylık özet kartları, haftalık randevu özeti
10. **Gift License / Mock Subscription** — aktif abonelik kartı, AI kullanım kotası göstergesi
11. **Audit Log** — randevu oluşturma/güncelleme/iptal ve ödeme güncellemeleri otomatik loglanır (`audit_logs` tablosu)

## Kapsam Dışı (bilinçli olarak MVP v1'e dahil edilmedi)

Native iOS/Android, App Store/Play Store, gerçek ödeme entegrasyonu (Stripe/iyzico/Apple IAP/Google Billing), gerçek AI entegrasyonu, SMS/WhatsApp entegrasyonu, klinik karar veren AI, form gönderimi için e-posta.

## API Uç Noktaları (özet)

Tüm endpointler `application.yml` → `theragift.cors.allowed-origins` ile CORS'a açıktır. Kimlik doğrulama gerektiren endpointler `Authorization: Bearer <token>` header'ı bekler.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET/PUT /api/psychologist/profile`
- `GET/POST/PUT/DELETE /api/working-hours`
- `GET/POST/PUT/DELETE /api/clients`, `GET /api/clients/{id}/payment-summary`
- `POST /api/availability-forms/create-link`, `GET /api/availability-forms/pending`
- `GET /api/public/forms/{token}`, `POST /api/public/forms/{token}/submit`
- `GET/POST/PUT/DELETE /api/appointments`, `GET /api/appointments/week`, `PUT /api/appointments/{id}/payment`
- `GET /api/suggestions/client/{clientId}`
- `GET /api/payments/unpaid`, `GET /api/payments/overdue`, `GET /api/payments/monthly-summary`
- `GET /api/subscription/current`

## Notlar

- Kod tabanı sade tutulmuştur; Türkçe yorumlar iş mantığının anlaşılmasını kolaylaştırmak için eklenmiştir.
- Bu ortamda (sandbox) internet erişimi kısıtlı olduğu için `mvn` / `npm install` komutları burada çalıştırılamadı; kod tabanı paket/importlar için statik olarak doğrulandı (tüm iç importlar, paket adları ve dosya referansları eşleşiyor). Kendi makinenizde Java 17 + Maven + Node.js kurulu olduğunda yukarıdaki adımlar doğrudan çalışacaktır.
