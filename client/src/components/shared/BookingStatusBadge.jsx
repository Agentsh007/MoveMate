import { BOOKING_STATUS_COLORS } from '../../utils/constants';

export default function BookingStatusBadge({ status }) {
  const colorClass = BOOKING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
