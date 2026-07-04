# Bugfix Backlog

Bu dosya, mevcut sprint kapsamına alınmayan ama sonraki bir bugfix sprintinde
ele alınması gereken bilinen sorunları takip etmek için tutulur. Buradaki
maddeler için bu sprintte (V2.2B) hiçbir kod değişikliği yapılmamıştır — sadece
not düşülmüştür.

## Açık Maddeler

- **Payments "İptal Edilenler" sekmesi**: Sadece `AppointmentStatus.CANCELLED`
  kayıtları göstermeli. Şu an bazı non-cancelled kayıtlar da görünebiliyor.
  Bir sonraki bugfix sprintinde düzeltilecek.
