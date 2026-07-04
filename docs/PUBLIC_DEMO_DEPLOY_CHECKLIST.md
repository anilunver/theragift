# TheraGift — Public Demo Deploy Checklist

Bu doküman, TheraGift'i gerçek bir public demo olarak (Vercel + Render/Railway + hosted PostgreSQL) yayına almak için izlenecek adımları listeler. Sırayla ilerleyin; her adımda "✅ test" notu varsa o adımı bitirmeden bir sonrakine geçmeyin.

## 1. GitHub push tamam mı?

- [ ] Kod GitHub'a push edildi (branch: bkz. son çalışma raporu).
- [ ] `.env`, gerçek secret veya şifre içeren hiçbir dosya repoya girmedi (sadece `.env.example` dosyaları var).

## 2. Hosted PostgreSQL oluştur

- [ ] Bir sağlayıcı seçin: Render (Managed PostgreSQL), Railway, Supabase, Neon vb.
- [ ] Veritabanı oluşturduktan sonra şu bilgileri not alın: **Host/URL**, **kullanıcı adı**, **şifre**, **port**, **DB adı**.
- [ ] JDBC URL formatına çevirin: `jdbc:postgresql://HOST:PORT/DBADI` (bazı sağlayıcılar `postgres://` formatında verir — `jdbc:` öneki eklemeniz gerekir).

## 3. Backend deploy servisi oluştur: Render veya Railway

- [ ] Render veya Railway'de yeni bir "Web Service" (Render) veya "Service" (Railway) oluşturun, GitHub reponuza bağlayın.

## 4. Backend root directory

- [ ] Root/Base directory: **`backend`**

## 5. Backend build command

```
mvn clean package -DskipTests
```

> Not: Bu repoda şu an bir Maven Wrapper (`mvnw`) dosyası **yoktur**. Render/Railway'in Java buildpack'i genelde kendi Maven'ını sağlar, bu yüzden düz `mvn` komutu çoğu zaman yeterlidir. Eğer platform "mvnw bulunamadı" hatası verirse, kendi bilgisayarınızda (Maven kurulu olduğu için) `cd backend && mvn -N wrapper:wrapper` çalıştırıp oluşan `mvnw`, `mvnw.cmd` ve `.mvn/` dosyalarını commit edin, sonra build command'ı `./mvnw clean package -DskipTests` olarak güncelleyin.

## 6. Backend start command

```
java -jar target/theragift-backend.jar
```

(`pom.xml` içinde `<finalName>theragift-backend</finalName>` tanımlı olduğu için jar adı sabittir; `java -jar target/*.jar` de çalışır.)

- [ ] Platformda **Java 17** runtime seçildiğinden emin olun (proje Java 17 gerektirir, daha eski sürümle derlenmez).

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
| `SERVER_PORT` | Genelde platform kendi portunu env ile verir (örn. Render `PORT`) | Render/Railway kendi port değişkenini otomatik enjekte edebilir; gerekirse `SERVER_PORT` yerine platformun kendi port mekanizmasını kullanın |

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
3. Render/Railway'de backend servisi oluştur (root: `backend`, build: `mvn clean package -DskipTests`, start: `java -jar target/theragift-backend.jar`)
4. Backend env değişkenlerini gir, deploy et
5. `/api/health` test et
6. Vercel'de frontend projesi oluştur (root: `frontend`, framework: Vite, build: `npm run build`, output: `dist`)
7. `VITE_API_BASE_URL` env'ini gir, deploy et
8. Backend `CORS_ALLOWED_ORIGINS`'e Vercel domain'ini ekle, backend'i yeniden başlat
9. Login → Dashboard → Public form testi
10. Gerçek veri girmeden önce demo/KVKK kontrolü
