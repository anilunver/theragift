# Bugfix Backlog

Bu dosya, mevcut sprint kapsamına alınmayan ama sonraki bir bugfix sprintinde
ele alınması gereken bilinen sorunları takip etmek için tutulur. Buradaki
maddeler için bu sprintte (V2.2B) hiçbir kod değişikliği yapılmamıştır — sadece
not düşülmüştür.

## Çözülmüş Maddeler

### Payments Cancelled Tab Filtering Bug — ÇÖZÜLDÜ (V2.2D)

- **Başlık**: Payments Cancelled Tab Filtering Bug
- **Problem**: İptal Edilenler sekmesi bazı durumlarda sadece iptal edilen
  randevuları göstermiyordu ("bazen" ifadesi anahtar ipucuydu).
- **Kök neden**: Backend (`PaymentService.getCancelled`) zaten baştan beri
  doğru şekilde sadece `AppointmentStatus=CANCELLED` kayıtları dönüyordu.
  Gerçek sorun frontend'de `Payments.jsx` içindeydi: kullanıcı sekmeler
  arasında hızlıca geçiş yaptığında, önceki sekmenin (örn. "Tahsil Edilecek")
  API isteği, yeni sekmenin (örn. "İptal Edilenler") isteğinden SONRA
  dönebiliyordu. Bu klasik bir race condition'dı — geç dönen eski cevap,
  state'i yanlış veriyle eziyordu.
- **Çözüm**: `loadTab()` artık her isteğin hangi sekme için atıldığını bir
  ref üzerinden takip ediyor; sadece hâlâ güncel olan sekmenin cevabı
  state'e yazılıyor, eski/geçersiz cevaplar yok sayılıyor. Ayrıca ek güvenlik
  katmanı olarak `filteredItems` içinde İptal Edilenler/Gelmeyenler
  sekmelerinde `a.status` doğrudan kontrol ediliyor.
- **Not**: Gelmeyenler sekmesi zaten doğru çalışıyordu; aynı race condition
  riski orada da vardı ama daha az fark ediliyordu, aynı düzeltme onu da kapsıyor.
- **Değişen dosya**: `frontend/src/pages/Payments.jsx`. Backend'e dokunulmadı.
