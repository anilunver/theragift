# TheraGift — Deployment Notes (V2.4.1)

Bu doküman **gerçek bir deploy işlemi değildir** — TheraGift'i bir sunucuya/production ortamına taşımadan önce bilinmesi gereken teknik notları ve kontrol edilmesi gereken noktaları listeler. Herhangi bir CI/CD, Docker production config veya gerçek deploy işlemi yapılmamıştır; bu sadece hazırlık dokümantasyonudur.

## 1. Gereksinimler

- **Java 17** — Backend `pom.xml` içinde `<java.version>17</java.version>` olarak sabitlenmiştir. Daha eski bir JDK ile derlenmez.
- **Maven 3.8+**
- **Node.js 18+** ve npm — Frontend Vite tabanlıdır.
- **PostgreSQL 16** — `docker-compose.yml` ile local'de container olarak sağlanır; production'da yönetilen bir PostgreSQL servisi (RDS, Railway, Render, Supabase vb.) kullanılması önerilir.

## 2. Ortam değişkenleri (V2.4.1'de gerçekten bağlandı)

Örnek dosyalar depoya eklendi ve gerçek kodla senkronize edildi:

- `.env.example` (repo kökü — sadece Docker Compose / PostgreSQL container'ı için, bkz. not aşağıda)
- `backend/.env.example` (Spring Boot / JWT / DB / CORS / seed)
- `frontend/.env.example` (Vite API base URL)

**V2.4.1 ile artık bu değişkenler gerçekten okunuyor:**

| Env değişkeni | Nerede kullanılıyor | Local varsayılan |
|---|---|---|
| `SERVER_PORT` | `application.yml` → `server.port` | `8080` |
| `SPRING_DATASOURCE_URL` | `application.yml` (postgres profili) → `spring.datasource.url` | `jdbc:postgresql://localhost:5432/theragift_db` |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | `theragift` |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | `theragift123` |
| `JWT_SECRET` | `application.yml` → `theragift.jwt.secret` | geliştirme placeholder'ı (aşağıya bakın) |
| `JWT_EXPIRATION_MS` | `theragift.jwt.expiration-ms` | `86400000` (24 saat) |
| `CORS_ALLOWED_ORIGINS` | `theragift.cors.allowed-origins` (→ `SecurityConfig.java`) | `http://localhost:5173` |
| `SEED_DATA_ENABLED` | `theragift.seed.enabled` (→ `SeedDataRunner.java`) | `true` |
| `VITE_API_BASE_URL` | `frontend/src/api/axios.js` | `http://localhost:8080/api` |

Tüm backend değerleri `application.yml` içinde `${ENV_VAR:local-default}` söz dizimiyle tanımlıdır — **hiçbir env değişkeni verilmezse local davranış birebir aynı kalır**. Frontend'de de aynı mantık: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'`.

**Not — root `.env.example` farklı bir katmandır:** `docker-compose.yml` (PostgreSQL container'ının kendisi) hâlâ sabit değerler kullanır ve bir `.env` dosyasından okumaz; bu V2.4.1 kapsamına dahil edilmedi (backend'in DB'ye NASIL bağlanacağı ile container'ın hangi kullanıcı/şifreyle ayağa kalkacağı ayrı konulardır). Local'de ikisi zaten aynı değerlerle uyumludur (`theragift` / `theragift123`).

## 3. JWT Secret — production uyarısı

`application.yml` içindeki varsayılan değer (`"theragift-super-secret-key-change-in-production-2026-please"`) **açıkça geliştirme amaçlıdır** ve sadece `JWT_SECRET` env değişkeni verilmediğinde kullanılır. Production ortamında:

- Mutlaka uzun, rastgele, tahmin edilemez bir secret kullanılmalıdır (örn. `openssl rand -base64 48`).
- `JWT_SECRET` ortam değişkeni ile sağlanmalı, asla kaynak koda (repoya) commit edilmemelidir.

## 4. CORS

`CORS_ALLOWED_ORIGINS` env değişkeni verilmezse `http://localhost:5173` kullanılır (local frontend). Production'da frontend'in gerçek domain'i (örn. `CORS_ALLOWED_ORIGINS=https://app.theragift.com`) bu değişkenle sağlanmalıdır. Birden fazla origin virgülle ayrılabilir (`SecurityConfig.java` içinde `allowedOrigins.split(",")` ile parse edilir). Wildcard (`*`) kullanılmaz — origin listesi her zaman açık/belirli tutulmalıdır.

## 5. Frontend API Base URL

`frontend/src/api/axios.js`, `VITE_API_BASE_URL` ortam değişkenini okur; verilmezse `http://localhost:8080/api` kullanılır. Production build'de backend farklı bir adreste çalışıyorsa `frontend/.env.production` içine `VITE_API_BASE_URL=https://api.theragift.com/api` gibi bir satır eklenmesi yeterlidir (Vite bu değeri build zamanında koda gömer). Uygulamadaki **tüm** API istekleri artık aynı ortak istemciyi (`api/axios.js`) kullanır — `PublicFormPage.jsx`'in kendi ayrı, sabit URL'li axios örneği V2.4.1'de kaldırıldı.

## 6. Veritabanı

- `spring.jpa.hibernate.ddl-auto: update` kullanılıyor — şema otomatik/ek olarak güncellenir. Production'da bu davranış (özellikle veri kaybı riski açısından) gözden geçirilmeli; büyük ölçekte migration aracı (Flyway/Liquibase) değerlendirilebilir. **Bu sprintte değiştirilmedi.**
- `docker-compose.yml` sadece local geliştirme için PostgreSQL container'ı sağlar; production'da yönetilen bir DB servisi önerilir.

## 7. Seed / Demo Data

`SeedDataRunner`, uygulama ayağa kalktığında (demo kullanıcı zaten yoksa) demo psikolog ve demo veri (danışanlar, randevular, Gift License aboneliği vb.) oluşturur. Bu, **local/pilot test için tasarlanmıştır**.

- **V2.4.1 ile artık gerçek bir on/off flag'i var:** `SEED_DATA_ENABLED=false` (→ `theragift.seed.enabled=false`) ile bu davranış tamamen kapatılabilir; `run()` metodunun en başında kontrol edilir, hiçbir demo veri oluşturulmaz.
- Gerçek/canlı kullanıma (gerçek danışan verisiyle) geçmeden önce bu flag'in `false` yapılması önerilir.
- Gerçek kullanım öncesi ayrıca KVKK/veri saklama politikası değerlendirilmelidir (bkz. `docs/PILOT_TEST_GUIDE.md`).

## 8. Health Check

`GET /api/health` (auth gerektirmez) — `{"status": "UP", "app": "TheraGift", "version": "V2.4"}` döner. Veritabanı bağlantı durumu, secret veya internal path bilgisi **kasıtlı olarak dönülmez**. Production'da bir load balancer / uptime monitoring servisi bu endpoint'i health check için kullanabilir. Bu sprintte davranışı değişmedi, sadece doğrulandı.

## 9. Kapsam dışı (bu sprintte yapılmadı)

- Gerçek deploy / hosting kurulumu
- Docker production image / multi-stage build
- CI/CD pipeline
- Flyway/Liquibase migration altyapısı
- SSL/domain ayarı
- `docker-compose.yml`'i env-var okur hale getirme (sadece backend/frontend env'i kapsam dahilindeydi)

## 10. Pilot öncesi hızlı kontrol listesi

- [ ] `backend/.env.example` içindeki notlar okundu, `JWT_SECRET` için production planı var
- [ ] `CORS_ALLOWED_ORIGINS` production domain'ine göre ayarlanacak
- [ ] Gerçek kullanıma geçmeden önce `SEED_DATA_ENABLED=false` yapılacak
- [ ] `VITE_API_BASE_URL` production backend adresine göre ayarlanacak
- [ ] `GET /api/health` erişilebilir ve beklenen cevabı dönüyor
- [ ] Gerçek danışan verisi girilmeden önce KVKK/veri saklama politikası değerlendirildi (bkz. `docs/PILOT_TEST_GUIDE.md`)
