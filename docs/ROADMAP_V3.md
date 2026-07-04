# TheraGift — V3 Roadmap

Bu doküman, MVP v2'nin gösterilebilir/stabil sürümünden sonra değerlendirilecek geliştirme fikirlerini listeler. Hiçbiri v2 kapsamında değildir; öncelik sırası iş ihtiyacına göre belirlenmelidir.

## 1. AI Destekli Randevu Yoğunluk Yorumu
Gerçek bir AI/LLM entegrasyonu değil; mevcut randevu ve çalışma saati verisinden basit istatistiksel yorum üretimi (örn. "Bu hafta Salı günleri en yoğun gününüz", "Önümüzdeki 7 günde 3 boş slotunuz var"). Klinik karar veya tanı içermez, yalnızca planlama/yoğunluk yorumu.

## 2. WhatsApp / SMS Hatırlatma Entegrasyonu
Randevu öncesi otomatik hatırlatma mesajları (örn. Twilio, Netgsm gibi sağlayıcılarla). Danışan onayı ve KVKK uyumluluğu gerektirir.

## 3. Online Ödeme Entegrasyonu
iyzico veya benzeri bir sağlayıcı ile gerçek tahsilat. Mevcut manuel ödeme takibi akışıyla birlikte çalışacak şekilde (hibrit) tasarlanmalı.

## 4. Paket Seans Yönetimi
Şu anda `PACKAGE_USED` ödeme durumu var ama paket tanımı (kaç seanslık, kaçı kullanıldı) ayrı bir entity olarak modellenmemiş. V3'te `SessionPackage` entity'si ile net paket takibi.

## 5. Takvim Drag & Drop
Haftalık takvimde randevuları sürükle-bırak ile yeniden planlama, çakışma kontrolüyle birlikte.

## 6. Google Calendar Entegrasyonu
Randevuların psikoloğun Google Calendar'ı ile iki yönlü senkronizasyonu.

## 7. Mobil PWA
Frontend'in PWA (installable, offline-first temel önbellekleme) haline getirilmesi. Native mağaza gerektirmez.

## 8. Kullanıcı Yetkilendirme Geliştirmeleri
- Şifre sıfırlama akışı (e-posta ile)
- Çoklu psikolog / klinik hesabı desteği (ADMIN rolünün gerçek kullanımı)
- Oturum süresi / refresh token mekanizması

## 9. KVKK / Gizlilik Sayfası
Danışan verilerinin işlenmesi, saklanması ve public form üzerinden toplanan verilerin aydınlatma metni. Hem uygulama içi hem public form sayfasında gösterilmeli.

## 10. Audit Log Geliştirmesi
V2.3 ile temel bir görüntüleme ekranı (Raporlar → İşlem Geçmişi) ve psikolog
bazlı tarih filtreleme eklendi (mevcut `audit_logs` tablosu yeniden
kullanıldı, yeni entity oluşturulmadı). Kalan geliştirmeler:
- Daha detaylı diff (ne değişti, eski/yeni değer)
- Şu an önceliklendirilmiş bir aksiyon listesi loglanıyor; her CRUD işlemi
  henüz kapsanmıyor — kapsam genişletilebilir
- Aksiyon tipine göre filtreleme/arama arayüzü

## 11. Production Deploy Planı
- Backend: Docker image + managed PostgreSQL (örn. Railway, Render, RDS)
- Frontend: Statik hosting (Vercel/Netlify) veya aynı container üzerinden Nginx
- Ortam değiş