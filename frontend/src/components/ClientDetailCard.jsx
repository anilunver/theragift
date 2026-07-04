export default function ClientDetailCard({ client }) {
  if (!client) return null
  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="text-lg font-extrabold text-ink">{client.firstName} {client.lastName}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${client.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
          {client.active ? 'Aktif' : 'Pasif'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted">Telefon:</span> <div className="font-semibold">{client.phone || '-'}</div></div>
        <div><span className="text-muted">E-posta:</span> <div className="font-semibold">{client.email || '-'}</div></div>
        <div><span className="text-muted">Seans Tercihi:</span> <div className="font-semibold">{client.sessionTypePreference === 'ONLINE' ? 'Online' : client.sessionTypePreference === 'FACE_TO_FACE' ? 'Yüz Yüze' : '-'}</div></div>
        <div><span className="text-muted">Varsayılan Ücret:</span> <div className="font-semibold">{client.defaultSessionFee ? `₺${client.defaultSessionFee}` : '-'}</div></div>
      </div>
      {client.availabilityNotes && (
        <div>
          <span className="text-muted text-sm">Uygunluk Notu:</span>
          <div className="text-sm bg-panel rounded-lg p-2 mt-1">{client.availabilityNotes}</div>
        </div>
      )}
      {client.notes && (
        <div>
          <span className="text-muted text-sm">Genel Notlar:</span>
          <div className="text-sm bg-panel rounded-lg p-2 mt-1">{client.notes}</div>
        </div>
      )}
    </div>
  )
}
