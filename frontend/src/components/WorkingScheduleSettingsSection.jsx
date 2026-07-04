import WorkingHoursForm from './WorkingHoursForm.jsx'
import UnavailableBlocksSection from './UnavailableBlocksSection.jsx'

// V2.2E: "Çalışma Takvimi" kategorisi. Haftalık çalışma saatleri ve çalışma
// dışı gün/tatil bloklarını tek bir mantıksal grup altında toplar. Her iki
// alt bölüm de zaten var olan component'leri AYNEN kullanır — davranış,
// endpoint'ler ve state yönetimi hiç değişmedi, sadece görsel gruplama.
export default function WorkingScheduleSettingsSection({ workingHours, onChanged }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-extrabold text-ink text-lg">Çalışma Takvimi</h3>
        <p className="text-sm text-muted mt-0.5">
          Haftalık çalışma saatlerinizi, mola aralıklarınızı ve çalışma dışı gün/tatil bloklarınızı yönetin.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <h4 className="font-bold text-ink mb-1">Haftalık Çalışma Saatleri</h4>
        <p className="text-xs text-muted mb-4">Her gün için aktif/pasif durumu, mesai saatleri ve mola aralığını belirleyin.</p>
        <WorkingHoursForm workingHours={workingHours} onChanged={onChanged} />
      </div>

      <UnavailableBlocksSection />
    </div>
  )
}
