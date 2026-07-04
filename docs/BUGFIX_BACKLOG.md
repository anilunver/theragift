# Bugfix Backlog

Bu dosya, mevcut sprint kapsamına alınmayan ama sonraki bir bugfix sprintinde
ele alınması gereken bilinen sorunları takip etmek için tutulur. Buradaki
maddeler için bu sprintte (V2.2B) hiçbir kod değişikliği yapılmamıştır — sadece
not düşülmüştür.

## Açık Maddeler

- **Payments "İptal Edilenler" sekmesi**: Sadece `AppointmentStatus.CANCELLED`
  kayıtları göstermeli. Şu an bazı non-cancelled kayıtlar da görünebiliyor.
  Bir sonraki bugfix sprintinde düzeltilecek.

### Payments Cancelled Tab Filtering Bug

- **Başlık**: Payments Cancelled Tab Filtering Bug
- **Problem**: İptal Edilenler sekmesi bazı durumlarda sadece iptal edilen
  randevuları göstermiyor.
- **Beklenen**: Sadece `AppointmentStatus=CANCELLED` kayıtları listelenmeli.
- **Not**: Gelmeyenler sekmesi doğru çalışıyor gibi görünüyor.
- **Öncelik**: Medium
- **Planlanan sprint**: V2.2C hotfix veya V2.2D
- V2.2C kapsamında bu bug için hiçbir kod değişikliği yapılmamıştır — sadece
  bu not eklenmiştir.
