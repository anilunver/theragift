# TheraGift — Public Demo Deploy Checklist

Bu doküman, TheraGift'i gerçek bir public demo olarak (Vercel + Render/Railway + hosted PostgreSQL) yayına almak için izlenecek adımları listeler. Sırayla ilerleyin; her adımda "✅ test" notu varsa o adımı bitirmeden bir sonrakine geçmeyin.

## 1. GitHub push tamam mı?

- [ ] Kod GitHub'a push edildi (branch: bkz. son çalışma raporu).
- [ ] `.env`, gerçek secret veya şifre içeren hiçbir dosya repoya girmedi (sadece `.env.example` dosyaları var).

## 2. Hosted PostgreSQL oluştur

- [ ] Bir sağlayıcı seçin: Render (Managed PostgreSQL), Railway, Supabase, Neon vb.
- [ ] Veritabanı oluşturduktan sonra şu bilgileri not alın: **Host/URL**, **kullanıcı adı**, **şifre**, **port**, **DB adı**.
- [ ] JDBC URL formatına çevirin: `jdbc:postgresql://HOST:PORT/DBADI` (bazı sağlayıcılar `postgres://` formatında verir — `jdbc:` öneki eklemeniz gerekir).

## 3. Backend deploy servisi oluştur: Render (Docker)

- [ ] Render'da yeni bir **"Web Service"** oluşturun, GitHub reponuza (`theragift`) bağlayın.
- [ ] Render'ın "Runtime" seçiminde **Docker** seçin (Render'da native Java runtime seçeneği görünmeyebiliyor; bu yüzden `backend/Dockerfile` üzerinden build alınacak).

## 4. Backend root directory

- [ ] Root Directory: **`backend`** (bu dizinde `Dockerfile`, `pom.xml` ve `src/` bulunur — monorepo olduğu için ZORUNLUDUR.)

## 5. Backend build ayarı (Docker)

- [ ] Docker runtime seçildiğinde Render Build/Start Command alanlarını göstermez — Root Directory içindeki **`Dockerfile`**'ı otomatik bulup onunla build alır. Ayrıca bir şey girmenize gerek yok.
- [ ] Render "Dockerfile Path" sorarsa: **`Dockerfile`** (Root Directory zaten `backend` olduğu için tam yol otomatik `backend/Dockerfile` olur).

`backend/Dockerfile`, multi-stage build ile çalışır: `maven:3.9-eclipse-temurin-17` image'ında Java 17 + Maven ile `mvn clean package -DskipTests` çalıştırır, ardından üretilen jar'ı hafif bir `eclipse-temurin:17-jre` runtime image'ına `app.jar` olarak kopyalar. Bu sayede Render'da Java runtime seçimi yapmanıza gerek kalmaz; her şey Docker image'ının içinde tanımlıdır.

## 6. Backend start command

- [ ] Docker runtime'da start command'ı da Render sormaz — `Dockerfile`'ın `ENTRYPOINT`'i otomatik çalışır ve Render'ın verdiği `PORT` değişkenine otomatik uyum sağlar (bkz. Adım 7'deki `PORT` satırı).

## 7. Backend environment variables

Platformun "Environment Variables" bölümüne şunları girin:

| Değişken | Örnek değer | Not |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:5432/<db>` | Adım 2'deki hosted DB bilgisi |
| `SPRING_DATASOURCE_USERNAME` | `<db-user>` | |
| `SPRING_DATASOURCE_PASSWORD` | `<db-password>` | **Asla repoya yazmayın** |
| `JWT_SECRET` | (uzun rastgele string) | `openssl rand -base64 48` ile üretin, asla repoya yazmayın |
| `JWT_EXPIRATION_MS` | `86400000` | İsteğe bağlı, varsayılan 24 saat |
| `CORS_ALLOWED_ORIGINS` | `https://<vercel-domain>` | Adım 9'da Vercel domain'i alındıktan sonra güncellenecek |
| `SEED_DATA_ENABLED` | `true` (demo için) / `false` (gerçek veri için) | Public demo'da `true` kalabilir ama bkz. Adım 19 |

- [ ] `PORT` değişkeni için ayrıca bir şey **eklemenize gerek yok** — Render bunu otomatik enjekte eder, `Dockerfile`'ın `ENTRYPOINT`'i bunu okuyup uygulamayı doğru portta başlatır. `SERVER_PORT`'u elle set etmenize gerek yoktur (istenirse hâlâ desteklenir, ama Render'da `PORT` önceliklidir).

## 8. Backend deploy sonrası test ✅

- [ ] Tarayıcıda açın: `https://BACKEND_DOMAIN/api/health`
- [ ] Beklenen cevap: `{"status":"UP","app":"TheraGift","version":"V2.4"}`
- [ ] Bu cevapta veritabanı bilgisi, secret veya internal path **görünmemeli**.

## 9. Vercel project oluştur

- [ ] [vercel.com](https://vercel.com) üzerinde "New Project" ile GitHub reponuzu import edin.

## 10. Vercel root directory

- [ ] **Root Directory: `frontend`** (Vercel proje ayarlarında "Root Directory" alanına `frontend` yazın — bu depo monorepo olduğu için ZORUNLUDUR, aksi halde Vercel `package.json`'ı bulamaz.)

## 11. Vercel framework

- [ ] Framework Preset: **Vite** (Vercel genelde otomatik algılar, algılamazsa manuel seçin.)

## 12. Build command

```
npm run build
```

## 13. Output directory

```
dist
```

## 14. Vercel environment variable

| Değişken | Değer |
|---|---|
| `VITE_API_BASE_URL` | `https://BACKEND_DOMAIN/api` (Adım 8'deki backend domain'i + `/api`) |

- [ ] Bu değişkeni Vercel'de **Production** (ve isterseniz Preview) ortamı için tanımlayın.
- [ ] `frontend/vercel.json` deploy hazırlığı kapsamında eklendi — SPA route'larının (örn. `/dashboard`, `/clients/5`) sayfa yenilemesinde 404 vermemesi için gereklidir, ekstra bir işlem yapmanıza gerek yok.

## 15. Backend CORS'a Vercel domain'ini ekle

- [ ] Vercel deploy tamamlanınca aldığınız domain'i (örn. `https://theragift.vercel.app`) backend'in `CORS_ALLOWED_ORIGINS` ortam değişkenine ekleyin ve backend servisini yeniden başlatın (redeploy).
- [ ] Birden fazla origin gerekiyorsa virgülle ayırın (örn. `https://theragift.vercel.app,https://www.theragift.app`).

## 16. Login test et ✅

- [ ] `https://FRONTEND_DOMAIN/login` açın, demo hesapla giriş yapın: `demo@theragift.app` / `password123`.

## 17. Dashboard test et ✅

- [ ] Giriş sonrası Dashboard'un yüklendiğini, hata vermediğini doğrulayın.

## 18. Public danışan formu test et ✅

- [ ] Ayarlar → Danışan Formları'ndan bir form linki oluşturun, linki gizli sekmede (oturumsuz) açıp formun yüklendiğini ve gönderilebildiğini doğrulayın.

## 19. Kız arkadaşa/gerçek kullanıcıya link atmadan önce demo/test veri kontrolü yap ⚠️

- [ ] **Gerçek danışan bilgisi girmeyin** — bu bir MVP/pilot demodur, klinik veri saklama/güvenlik altyapısı production seviyesinde değildir.
- [ ] Demo veri (`SEED_DATA_ENABLED=true` ile gelen 5 danışan, örnek randevular) public demoyu göstermek için yeterlidir; gerçek kimlik/telefon/e-posta bilgisi girmeyin.
- [ ] Eğer bu ortamı gerçek danışanlarla kullanmayı düşünüyorsanız, önce `docs/PILOT_TEST_GUIDE.md`'deki KVKK/mahremiyet notunu okuyun ve `SEED_DATA_ENABLED=false` yapmayı değerlendirin.
- [ ] `JWT_SECRET`'in gerçekten güçlü/rastgele olduğunu ve hiçbir yerde (commit, ekran görüntüsü, mesaj) paylaşılmadığını doğrulayın.

---

## Hızlı özet — sıralı akış

1. GitHub push ✅
2. Hosted PostgreSQL oluştur
3. Render'da backend servisi oluştur — Runtime: **Docker**, Root Directory: `backend` (build/start command Render tarafından `backend/Dockerfile`'dan otomatik alınır)
4. Backend env değişkenlerini gir, deploy et
5. `/api/health` test et
6. Vercel'de frontend projesi oluştur (root: `frontend`, framework: Vite, build: `npm run build`, output: `dist`)
7. `VITE_API_BASE_URL` env'ini gir, deploy et
8. Backend `CORS_ALLOWED_ORIGINS`'e Vercel domain'ini ekle, backend'i yeniden başlat
9. Login → Dashboard → Public form testi
10. Gerçek veri girmeden önce demo/KVKK kontrolü
