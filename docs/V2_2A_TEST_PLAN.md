# TheraGift V2.2A — Test Planı
## Client Workflow and Recurring Appointments

Bu doküman, V2.2A sprintinde eklenen özellikler için manuel test listesidir.
Testlerden önce backend'i yeniden başlatın (yeni tablolar `spring.jpa.hibernate.ddl-auto`
ayarına göre otomatik oluşur, seed verisi ilk açılışta bir kez eklenir).

---

## 1. Sabit randevu (recurring appointment) oluşturma

1. Danışanlar → bir danışana tıklayın → danışan detay sayfasını açın.
2. "Sabit Randevu" bölümünde "+ Yeni Kural" butonuna tıklayın.
3. Gün, saat, süre, seans türü, ücret, tekrar sıklığı (Her hafta / İki haftada bir / Ayda bir)
   seçip "Kuralı Kaydet" deyin.
4. **Beklenen:** Kural listede görünür, silinene/pasif yapılana kadar kalıcıdır.

## 2. Önümüzdeki 4 hafta randevuları oluşturma

1. Oluşturduğunuz (veya demo verideki Selin Aydın / Mehmet Kaya) kuralın yanındaki
   "Önümüzdeki 4 hafta" butonuna tıklayın.
2. **Beklenen:** Kaç randevu oluşturulduğu ve varsa kaç tanesinin çakışma nedeniyle
   atlandığı bilgisi ekranda görünür; oluşturulan randevular Takvim sayfasında görünür.
3. Aynı butona tekrar basın.
4. **Beklenen:** Daha önce üretilen occurrence'lar zaten dolu olduğu için ikinci
   üretimde "çakışma" olarak atlanır (mükerrer randevu oluşmaz).

## 3. Çakışma kontrolü (recurring)

1. Demo veride: Mehmet Kaya için "iki haftada bir Cumartesi 11:00" kuralı ve
   gelecek Cumartesi 11:00'da başka bir danışana (Can Özdemir) ait sabit bir
   randevu seed edilmiştir.
2. Mehmet Kaya'nın kuralı için "Önümüzdeki 4 hafta"yı çalıştırın.
3. **Beklenen:** İlk occurrence (gelecek Cumartesi) "çakışma nedeniyle atlandı"
   olarak raporlanır, randevu oluşturulmaz; sistem hata vermez, diğer occurrence'lar
   etkilenmez.
4. Takvimde o saatte hâlâ sadece Can Özdemir'in randevusunun olduğunu doğrulayın.

## 4. Danışan düzenleme (client edit)

1. Danışan detay sayfasında "Danışanı Düzenle" butonuna tıklayın.
2. Ad, soyad, telefon, e-posta, seans tercihi, varsayılan ücret, ödeme yöntemi,
   uygunluk notu, genel notlar ve aktif/pasif durumunu değiştirip kaydedin.
3. **Beklenen:** Toast ile "Danışan güncellendi" mesajı görünür; danışan detay
   kartı ve (varsa) Danışanlar listesi güncel bilgiyi gösterir.
4. Zorunlu alanları (ad/soyad) boş bırakıp kaydetmeyi deneyin.
5. **Beklenen:** Hata mesajı gösterilir, kayıt yapılmaz.

## 5. Danışan notu ekleme/silme

1. Danışan detay sayfasında "Notlar" bölümüne bir not yazıp "Ekle" deyin.
2. **Beklenen:** Not listeye eklenir, tarih/saat damgasıyla görünür.
3. Bir notu silin.
4. **Beklenen:** Not listeden kaldırılır, toast ile onay mesajı görünür.
5. Demo veride Can Özdemir, Selin Aydın ve Elif Yıldız için önceden birer not
   olduğunu doğrulayın.

## 6. Dashboard randevu modalı

1. Dashboard → "Bu Haftaki Randevular" listesinden bir randevuya tıklayın.
2. **Beklenen:** AppointmentModal açılır; randevu detayları, durum ve ödeme
   rozetleri görünür.
3. Sırasıyla deneyin: "✓ Tamamlandı", "✕ Gelmedi", "💳 Ödeme Güncelle",
   "Danışan detayına git", "Randevuyu İptal Et".
4. **Beklenen:** Her aksiyon backend'e istek atar, toast gösterir, Dashboard
   verisi (istatistik kartları dahil) güncellenir.

## 7. Yeni randevuda danışan varsayılanları

1. Yeni Randevu ekranında bir danışan seçin (örn. Mehmet Kaya, varsayılan ücreti ₺1.800).
2. **Beklenen:** Seans ücreti ve seans türü alanları otomatik dolar; siz yine de
   bu alanları değiştirebilirsiniz (randevuya özel override).

## 8. Takvimde sabit randevular

1. 2. maddede oluşturduğunuz occurrence'ları Takvim sayfasında haftayı ileri
   alarak kontrol edin.
2. **Beklenen:** Sabit randevudan üretilen kayıtlar normal randevular gibi
   görünür (renk kodlama, saat aralığı, durum/ödeme rozetleri dahil) — ayrı bir
   görsel öğeye ihtiyaç yoktur çünkü gerçek Appointment kaydıdır.

## 9. Ödeme ekranı ve öneriler bozulmadı mı?

1. Payments sayfasında tüm sekmeleri (Tahsil Edilecek / Geciken / Kısmi Ödenen /
   Ödenenler / Paket-Ücretsiz / Tüm Seanslar), filtreleri ve sıralamayı test edin.
2. **Beklenen:** V2.1.1'de doğrulanan davranış aynen çalışır (bu sprintte
   Payment/Suggestion mantığına dokunulmadı).
3. Suggestions sayfasında bir danışan seçip önerileri kontrol edin.
4. **Beklenen:** En erken uygun slot önceliği, İptal edilen randevu boşluğu
   tespiti gibi V2.1.1 davranışları değişmeden çalışır.

---

### Notlar
- Sabit randevu occurrence üretimi, normal "Yeni Randevu" akışıyla AYNI merkezi
  çakışma kontrolünden (`AppointmentService.hasConflict`) geçer — CANCELLED
  randevular çakışma sayılmaz.
- Mola/mesai dışı gibi yumuşak uyarılar occurrence üretimini engellemez, sadece
  "Bilgilendirme" olarak raporlanır.
- Danışan notları (`ClientNote`) bilinçli olarak klinik/terapi içeriği DEĞİLDİR —
  yalnızca operasyonel bilgi (ödeme alışkanlığı, seans tercihi vb.) için tasarlanmıştır.
