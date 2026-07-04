# TheraGift MVP v2 (Polish)

Psikologlar için web-first responsive dijital asistan sistemi. Randevu planlama, danışan uygunluk toplama, haftalık takvim, manuel seans ödeme takibi, algoritmik randevu önerisi ve Gift License / mock subscription altyapısı sağlar.

Bu depo tam çalışan bir **local MVP**'dir: Spring Boot backend + React frontend + PostgreSQL (Docker). v2, v1'in üzerine UI/UX polish, Türkçe format düzeltmeleri, veri akışı iyileştirmeleri ve kullanıcı geri bildirimi (toast/loading/empty state) katmanı ekler — API sözleşmesi ve veritabanı şeması değişmemiştir.

## Amaç

- Psikoloğun randevu planlamasını kolaylaştırmak
- Danışan uygunluklarını toplamak (public link, oturum gerektirmez)
- Haftalık takvim düzeni sağlamak
- Manuel seans ödeme takibi yapmak
- Algoritmik randevu önerisi sunmak
- Gift License / mock subscription altyapısı sağlamak

## Teknoloji

- **Backend:** Java 17, Spring Boot 3.2, Maven, Spring Security + JWT, Spring Data JPA, Lombok
- **Frontend:** React 18, Vite, Tailwind CSS v3, React Router, Axios
- **Database:** PostgreSQL 16 (Docker) — ana profil. Hızlı local test için H2 profili de mevcut.

## Klasör Yapısı

```
theragift/
  backend/           Spring Boot API (port 8080)
  frontend/          React + Vite arayüzü (port 5173)
  docs/
    wireframes/      Tasarım referans SVG'leri
    ROADMAP_V3.md    Sonraki faz planı
  docker-compose.yml PostgreSQL container
  README.md
```

## Kurulum ve Çalıştırma

### 1) PostgreSQL'i başlat (Docker)

```bash
docker compose up -d
```

Bu, `theragift_db` veritabanını `localhost:5432` üzerinde ayağa kaldırır.
(DB: `theragift_db`, kullanıcı: `theragift`, şifre: `theragift123`)

### 2) Backend'i çalıştır

> **Önkoşul:** Java 17 (proje Java 17 hedefler; Java 11 veya daha eski bir sürümle derlenmez/çalışmaz). Maven 3.8+ önerilir.

**Terminal ile:**
```bash
cd backend
mvn spring-boot:run
```

**IntelliJ IDEA ile:**
1. `backend/pom.xml` dosyasını "Open as Project" ile açın (Maven otomatik indirilir).
2. `src/main/java/com/theragift/TheragiftApplication.java` dosyasını açıp yeşil ▶ butonuna basın.
3. Varsayılan aktif profil `postgres`'tir; Docker'daki PostgreSQL ayakta olmalı.
4. Backend `http://localhost:8080` üzerinde açılır.

İlk açılışta `SeedDataRunner` otomatik olarak demo verisini oluşturur (demo psikolog, 5 danışan, çalışma saatleri, çeşitli ödeme durumlarında randevular, Gift License aboneliği, AI kullanım kotası). **Bu seed data korunmuştur, davranışı değiştirilmedi.** `SEED_DATA_ENABLED=false` ortam değişkeniyle bu davranış tamamen kapatılabilir — gerçek danışan verisiyle kullanmadan önce bunun yapılması önerilir (bkz. `docs/DEPLOYMENT_NOTES.md`).

> Docker olmadan hızlı test etmek isterseniz: IntelliJ'de Run Configuration → Active profiles alanına `h2` yazarak bellek içi veritabanı kullanabilirsiniz (ana hedef yine de PostgreSQL'dir).

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

## Çalışan Modüller

1. **Auth** — JWT tabanlı login/register, `GET /api/auth/me`, korumalı frontend route'ları
2. **Psikolog Profili** — görüntüleme/güncelleme, kayıt sonrası toast bildirimi
3. **Çalışma Saatleri** — gün/saat/mola tanımlama, CRUD, Pazartesi→Pazar sıralama, aynı gün için duplicate uyarısı
4. **Danışan Yönetimi** — CRUD, danışan detay sayfası, ödeme özeti, isimler title case gösterilir
5. **Danışan Uygunluk Formu** — token'lı public link üretimi, oturum açmadan form doldurma, Bekleyen/Yanıtlanan form listeleri
6. **Randevu & Haftalık Takvim** — CRUD, çakışma kontrolü, haftalık görünüm, randevu modalı (tamamlandı/gelmedi/iptal onaylı)
7. **Randevu Öneri Algoritması** — çalışma saatleri + mevcut randevular + danışan uygunluk notuna göre en uygun 3 slotu skorlayarak önerir
8. **Seans Ücreti & Ödeme Takibi** — ödeme durumu/yöntemi/kısmi ödeme takibi, ödenmemiş/geciken listeleri, aylık özet, tutarlı ₺ formatı
9. **Dashboard** — günlük/aylık özet kartları, haftalık randevu özeti, hızlı aksiyonlar (yeni randevu / danışan ekle)
10. **Gift License / Mock Subscription** — premium görünümlü kart, AI kullanım kotası göstergesi
11. **Audit Log** — randevu oluşturma/güncelleme/iptal ve ödeme güncellemeleri otomatik loglanır (`audit_logs` tablosu)

## v2'de Eklenen Kullanıcı Deneyimi İyileştirmeleri

- Tüm sayfalarda tutarlı loading / hata / boş durum bileşenleri
- Başarılı işlemlerde toast bildirimi (danışan eklendi, randevu oluşturuldu, ödeme güncellendi, form linki oluşturuldu, profil kaydedildi)
- Türkçe enum gösterimleri (randevu durumu, ödeme durumu, seans türü, ödeme yöntemi)
- Saat `HH:mm`, tarih `gg.aa.yyyy`, para `₺1.500` formatında tutarlı gösterim
- İsimler title case (`züleyha bıçak` → `Züleyha Bıçak`)
- Randevu oluştururken danışan seçimi zorunlu, saat mantığı doğrulanıyor
- Sidebar/topbar/kart tasarımlarında görsel tutarlılık ve gölge/boşluk iyileştirmeleri

## Bilinen Eksikler / Kapsam Dışı

Native iOS/Android, App Store/Play Store, gerçek ödeme entegrasyonu (Stripe/iyzico/Apple IAP/Google Billing), gerçek AI entegrasyonu, SMS/WhatsApp entegrasyonu, klinik karar veren AI, form gönderimi için e-posta bildirimi, dashboard'un canlı (WebSocket) güncellenmesi (sayfa yenilemesi gerekir).

## API Uç Noktaları (özet)

Tüm endpointler `application.yml` → `theragift.cors.allowed-origins` ile CORS'a açıktır. Kimlik doğrulama gerektiren endpointler `Authorization: Bearer <token>` header'ı bekler.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET/PUT /api/psychologist/profile`
- `GET/POST/PUT/DELETE /api/working-hours`
- `GET/POST/PUT/DELETE /api/clients`, `GET /api/clients/{id}/payment-summary`
- `POST /api/availability-forms/create-link`, `GET /api/availability-forms/pending`, `GET /api/availability-forms`
- `GET /api/public/forms/{token}`, `POST /api/public/forms/{token}/submit`
- `GET/POST/PUT/DELETE /api/appointments`, `GET /api/appointments/week`, `PUT /api/appointments/{id}/payment`
- `GET /api/suggestions/client/{clientId}`
- `GET /api/payments/unpaid`, `GET /api/payments/overdue`, `GET /api/payments/monthly-summary`
- `GET /api/subscription/current