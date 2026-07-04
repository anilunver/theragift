import { fullNameTitleCase, formatCurrency, sessionTypeLabel } from '../utils/format.js'

export default function ClientDetailCard({ client }) {
  if (!client) return null
  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-brand-soft text-brand-dark font-extrabold flex items-center justify-center text-base shrink-0">
          {(client.firstName?.[0] || '').toUpperCase()}{(client.lastName?.[0] || '').toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-ink truncate">{fullNameTitleCase(client.firstName, client.lastName)}</h3>
          <span className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${client.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            {client.active ? 'Aktif' : 'Pasif'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted text-xs mb-0.5">Telefon</div>
          <div className="font-semibold">{client.phone || '-'}</div>
        </div>
        <div>
          <div className="text-muted text-xs mb-0.5">E-posta</div>
          <div className="font-semibold truncate">{client.email || '-'}</div>
        </div>
        <div>
          <div className="text-muted text-xs mb-0.5">Seans Tercihi</div>
          <div className="font-semibold">{client.sessionTypePreference ? sessionTypeLabel(client.sessionTypePreference) : '-'}</div>
        </div>
        <div>
          <div className="text-muted text-xs mb-0.5">Varsayılan Ücret</div>
          <div className="font-semibold">{client.defaultSessionFee ? formatCurrency(client.defaultSessionFee) : '-'}</div>
        </div>
      </div>
      {client.availabilityNotes && (
        <div>
          <span className="text-muted te