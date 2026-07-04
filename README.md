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

İlk açılışta `SeedDataRunner` otomatik olarak demo verisini oluşturur (demo psikolog, 5 danışan, çalışma saatleri, çeşitli ödeme durumlarında randevular, Gift License aboneliği, AI kullanım kotası). **Bu seed data korunmuştur, v2'de değiştirilmedi.**

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
- `GET /api/subscription/current`

## V3 Roadmap

Bkz. [`docs/ROADMAP_V3.md`](docs/ROADMAP_V3.md).

## Notlar

- Kod tabanı sade tutulmuştur; Türkçe yorumlar iş mantığının anlaşılmasını kolaylaştırmak için eklenmiştir.
- v2 polish çalışması yalnızca frontend'de yapılmıştır; backend API sözleşmesi, entity yapısı ve seed data korunmuştur.

## V2.2F — Pilot Demo Polish & UX Consistency

Bu sprint yeni bir özellik eklemedi; Dashboard, Takvim, Danışan Detayı, Ödemeler,
Öneriler ve Ayarlar sayfalarında görsel tutarlılık, okunabilirlik ve demo sunum
kalitesi iyileştirildi (durum rozetleri, boş/loading/hata durumları, modal
düzeni, mikro metinler). Sadece frontend değişti; hiçbir endpoint, hesaplama
mantığı veya veri modeli değişmedi.

## V2.3 — Reports, Export and Activity Log

Yeni "Raporlar" sayfası eklendi (Finans / Randevular / Danışanlar / İşlem
Geçmişi sekmeleri, tarih filtresi: Bu ay / Geçen ay / Son 30 gün / Özel
aralık). Finans ve randevu raporları, Ödemeler sayfasındaki mevcut
CANCELLED/NO_SHOW hariç tutma ve PARTIAL_PAID/FREE/PACKAGE_USED kurallarını
birebir yeniden kullanır; hiçbir hesaplama mantığı değişmedi. CSV dışa
aktarım (Finans/Randevu/Danışan raporları) tamamen frontend'de üretilir,
Excel uyumluluğu için UTF-8 BOM eklenir; yeni bir backend export endpoint'i
açılmadı.

İşlem geçmişi (activity log) için yeni bir tablo oluşturulmadı — Faz 1'den
beri var olan `audit_logs` tablosu (`AuditLog` entity) `GET /api/activity-logs`
ile psikolog bazlı sorgulanabilir hale getirildi ve randevu/ödeme kayıtlarına
ek olarak danışan oluşturma/pasifleştirme, not ekleme, çalışma dışı blok
ekleme ve toplu ücret güncellemesi de loglanmaya başlandı. KVKK gereği not
içeriği asla log açıklamasına yazılmaz, sadece kısa operasyonel bir cümle
("X danışanı için not eklendi.") kaydedilir.

Dashboard'a mevcut yapıyı ağırlaştırmadan küçük bir "Bu Ayın Özeti" kart
satırı ve "Son İşlemler" mini listesi eklendi; ikisi de yeni Reports/Activity
Log endpoint'lerini yeniden kullanır. Yeni endpointler: `GET /api/reports/financial`,
`GET /api/reports/appointments`, `GET /api/reports/clients`, `GET /api/activity-logs`
— hepsi giriş yapan psikoloğun verisiyle sınırlıdır.
