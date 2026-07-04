import { paymentStatusLabel } from '../utils/format.js'

const STYLES = {
  PAID: 'bg-green-100 text-green-800',
  UNPAID: 'bg-red-100 text-red-700',
  PAY_LATER: 'bg-amber-100 text-amber-800',
  PARTIAL_PAID: 'bg-blue-100 text-blue-800',
  PACKAGE_USED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
  NO_SHOW: 'bg-gray-300 text-gray-800',
  FREE: 'bg-teal-100 text-teal-800',
}

export default function PaymentStatusBadge({ status }) {
  const className = STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>
      {paymentStatusLabel(status)}
    </span>
  )
}
