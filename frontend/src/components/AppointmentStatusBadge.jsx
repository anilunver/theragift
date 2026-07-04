import { appointmentStatusLabel } from '../utils/format.js'

const STYLES = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
  NO_SHOW: 'bg-red-100 text-red-700',
}

export default function AppointmentStatusBadge({ status }) {
  const className = STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>
      {appointmentStatusLabel(status)}
    </span>
  )
}
