// Utility: format price in BDT
export const formatPrice = (amount, unit) => {
  if (!amount) return 'Contact for price';
  const formatted = new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
  }).format(amount);
  const suffix = unit === 'per_night' ? '/night' : unit === 'per_month' ? '/month' : '';
  return `৳${formatted}${suffix}`;
};
