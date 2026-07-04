import { useNavigate } from 'react-router-dom'
import { fullNameTitleCase, formatCurrency, sessionTypeLabel } from '../utils/format.js'
import EmptyState from './EmptyState.jsx'

export default function ClientTable({ clients }) {
  const navigate = useNavigate()

  if (!clients || clients.length === 0) {
    return <EmptyState text="Danışan yok. Yeni danışan eklemek için sağ üstteki butonu kullanın." icon="👥" />
  }

  return (
    <div className="overflow-x-auto bg-white border border-border rounded-2xl shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border bg-panel/60">
            <th className="px-4 py-3 font-semibold">Ad Soyad</th>
            <th className="px-4 py-3 font-semibold">Telefon</th>
            <th className="px-4 py-3 font-semibold hidden md:table-cell">Seans Tercihi</th>
            <th className="px-4 py-3 font-semibold hidden md:table-cell">Varsayılan Ücret</th>
            <th className="px-4 py-3 font-semibold">Durum</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.id}
              className="border-b border-border last:border-0 hover:bg-panel cursor-pointer transition-colors"
              onClick={() => navigate(`/clients/${c.id}`)}
            >
              <td className="px-4 py-3 font-semibold text-ink">{fullNameTitleCase(c.firstName, c.lastName)}</td>
              <td className="px-4 py-3 text-muted">{c.phone || '-'}</td>
              <td className="px-4 py-3 text-muted hidden md:table-cell">
                {c.sessionTypePreference ? sessionTypeLabel(c.sessionTypePreference) : '-'}
              </td>
              <td className="px-4 py-3 text-muted hidden md:table-cell">
                {c.defaultSessionFee ? formatCurrency(c.defaultSessionFee) : '-'}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                  {c.active ? 'Aktif' : 'Pasif'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
