// App constants
export const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: 'Hotel' },
  { value: 'flat', label: 'Flat', icon: 'Building2' },
  { value: 'apartment', label: 'Apartment', icon: 'Building' },
  { value: 'sublet', label: 'Sublet', icon: 'Home' },
  // { value: 'tolet', label: 'To-Let', icon: 'DoorOpen' },
  // { value: 'room', label: 'Room', icon: 'BedDouble' },
];

export const BOOKING_MODELS = [
  { value: 'hotel_style', label: 'Hotel Style' },
  { value: 'short_term', label: 'Short Term' },
  { value: 'long_term', label: 'Long Term' },
];

export const BOOKING_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  visited: 'bg-blue-100 text-blue-700',
  contracted: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-200 text-gray-600',
  completed: 'bg-emerald-100 text-emerald-700',
};

export const AMENITIES_LIST = [
  'WiFi', 'AC', 'Parking', 'Kitchen', 'Elevator',
  'Generator', 'Security', 'Laundry', 'Rooftop', 'Gym',
  'Pool', 'CCTV', 'Balcony', 'Furnished', 'Gas Stove',
  'Water Heater', 'TV', 'Washing Machine',
];

export const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };
