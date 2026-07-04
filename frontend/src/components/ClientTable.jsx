import { useNavigate } from 'react-router-dom'

export default function ClientTable({ clients }) {
  const navigate = useNavigate()

  if (!clients || clients.length === 0) {
    return <div className="text-muted text-sm p-6 text-center">Henüz danışan eklenmemiş.</div>
  }

  return (
    <div className="overflow-x-auto bg-white border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border">
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
              className="border-b border-border last:border-0 hover:bg-panel cursor-pointer"
              onClick={() => navigate(`/clients/${c.id}`)}
            >
              <td className="px-4 py-3 font-semibold text-ink">{c.firstName} {c.lastName}</td>
              <td className="px-4 py-3 text-muted">{c.phone || '-'}</td>
              <td className="px-4 py-3 text-muted hidden md:table-cell">
                {c.sessionTypePreference === 'ONLINE' ? 'Online' : c.sessionTypePreference === 'FACE_TO_FACE' ? 'Yüz Yüze' : '-'}
              </td>
              <td className="px-4 py-3 text-muted hidden md:table-cell">
                {c.defaultSessionFee ? `₺${c.defaultSessionFee}` : '-'}
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
