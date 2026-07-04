# TheraGift — Pilot Kullanım Rehberi

## Amaç

Bu doküman, TheraGift'i gerçek bir psikologla pilot/deneme amaçlı kullanıma açmadan önce ve açtıktan sonra izlenecek adımları, test edilmesi gereken senaryoları ve ürünün bilinen sınırlamalarını özetler. TheraGift şu an bir **MVP (Minimum Viable Product)** aşamasındadır; bu rehber, pilot kullanımın güvenli ve gerçekçi beklentilerle yürütülmesini sağlamak içindir.

## Kim kullanacak?

- Tek bir psikolog (veya küçük bir pilot grubu), kendi randevu/danışan/ödeme takibini dijitalleştirmek isteyen.
- Ürünü ilk kez deneyen, teknik bilgisi sınırlı olabilecek son kullanıcılar.
- **Bu rehber klinik personel için değil, ürünü test eden/pilot süren kişi(ler) içindir.**

## Pilot öncesi yapılacaklar

1. Backend'in Java 17 ile derlenip çalıştığından emin olun (bkz. README "Kurulum ve Çalıştırma").
2. `docker compose up -d` ile PostgreSQL'in ayakta olduğunu doğrulayın.
3. Demo hesapla (`demo@theragift.app` / `password123`) giriş yapılabildiğini doğrulayın.
4. `GET /api/health` endpoint'inin `{"status":"UP", ...}` döndüğünü kontrol edin.
5. **Gerçek danışan verisi girmeden önce KVKK ve veri saklama politikanızı değerlendirin** (bkz. aşağıdaki "KVKK / Mahremiyet" bölümü). Pilot testte mümkünse anonim/test veri kullanın.
6. Dashboard'daki "TheraGift'i kullanıma hazırla" kontrol listesini psikoloğa tanıtın — bu liste onları ilk adımlarda yönlendirir.

## Test senaryoları

Aşağıdaki 12 senaryo, uygulamanın uçtan uca temel akışlarını kapsar:

1. **Giriş yap** — demo veya gerçek hesapla login.
2. **Klinik profilini tamamla** — Ayarlar → Klinik Profili, klinik adı/unvan/uzmanlık alanı gibi bilgileri doldur.
3. **Çalışma saatlerini ayarla** — Ayarlar → Çalışma Takvimi, en az bir gün için saat aralığı tanımla.
4. **Danışan ekle** — Danışanlar sayfasından yeni bir danışan kaydı oluştur.
5. **Randevu oluştur** — Takvim veya "+ Yeni randevu" ile bir randevu planla.
6. **Ödeme güncelle** — Ödemeler sayfasından bir randevunun ödeme durumunu/tutarını güncelle.
7. **Danışan notu ekle** — Danışan detay sayfasından not defterine bir not ekle.
8. **Çalışma dışı gün ekle** — Takvim veya Ayarlar üzerinden bir tatil/çalışma dışı blok tanımla.
9. **Önerilerden slot seç** — Öneriler sayfasında bir danışan seçip önerilen bir slotu kullanarak randevu oluştur.
10. **Rapor al** — Raporlar sayfasında bir tarih aralığı seçip Finans/Randevu/Danışan sekmelerini incele.
11. **CSV indir** — Raporlar sayfasından en az bir CSV dosyası indir, Türkçe karakterlerin düzgün göründüğünü doğrula.
12. **Activity log kontrol et** — Raporlar → İşlem Geçmişi (veya Dashboard → Son İşlemler) altında az önce yapılan işlemlerin (randevu, ödeme, not) göründüğünü doğrula.

## Bilinen sınırlamalar

- **Klinik AI yoktur.** Sistem hiçbir terapi, teşhis veya tedavi önerisi üretmez; sadece randevu/ödeme/rapor gibi operasyonel işlevler sunar.
- Gerçek ödeme entegrasyonu (Stripe/iyzico vb.) yoktur — ödemeler manuel olarak işaretlenir.
- SMS/WhatsApp/e-posta bildirimi yoktur.
- PDF/Excel (xlsx) export yoktur — sadece CSV export mevcuttur.
- Gerçek grafik/görselleştirme kütüphanesi kullanılmaz — raporlar kart/tablo formatındadır.
- Çoklu psikolog/klinik ekip yönetimi yoktur; sistem tek psikolog hesabı varsayımıyla çalışır.
- Seed/demo veri, uygulama her başlatıldığında otomatik oluşturulur (bkz. `docs/DEPLOYMENT_NOTES.md`) — gerçek/canlı kullanım öncesi bu davranış gözden geçirilmelidir.

## KVKK / Mahremiyet Notu

**Bu bir hukuki metin değildir; sadece pilot kullanıcıları bilgilendirmek amaçlı bir hatırlatmadır.**

- Bu MVP klinik karar vermez; terapi, teşhis veya tedavi önerisi üretmez.
- Danışan notları (özellikle seans notları) hassas kişisel veri olabilir.
- **Gerçek danışan verisi girmeden önce KVKK (Kişisel Verilerin Korunması Kanunu) ve kurumunuzun veri saklama politikasına uygunluk değerlendirilmelidir.**
- Pilot testte, mümkünse gerçek danışan bilgileri yerine anonim veya kurgusal test verisi kullanılması önerilir.
- Activity log (işlem geçmişi) sadece operasyonel bilgi tutar (örn. "X danışanı için not eklendi") — not içeriği veya klinik detay hiçbir zaman log'a yazılmaz.

Bu not aynı zamanda uygulama içinde **Ayarlar → Güvenlik & Veri** bölümünde de gösterilmektedir.
