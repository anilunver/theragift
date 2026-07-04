const STYLES = {
  PAID: { label: 'Ödendi', className: 'bg-green-100 text-green-800' },
  UNPAID: { label: 'Ödenmedi', className: 'bg-red-100 text-red-700' },
  PAY_LATER: { label: 'Sonra Ödenecek', className: 'bg-amber-100 text-amber-800' },
  PARTIAL_PAID: { label: 'Kısmi Ödendi', className: 'bg-blue-100 text-blue-800' },
  PACKAGE_USED: { label: 'Paketten Düşüldü', className: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: 'İptal', className: 'bg-gray-200 text-gray-700' },
  NO_SHOW: { label: 'Gelmedi', className: 'bg-gray-300 text-gray-800' },
  FREE: { label: 'Ücretsiz', className: 'bg-teal-100 text-teal-800' },
}

export default function PaymentStatusBadge({ status }) {
  const style = STYLES[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  )
}
