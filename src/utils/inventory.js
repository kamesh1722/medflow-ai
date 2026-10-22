export function stockStatus(medicine) {
  if (Number(medicine.quantity) <= 0) return 'Out of stock'
  if (Number(medicine.quantity) <= Number(medicine.minimumStock)) return 'Low stock'
  return 'Normal stock'
}

export function expiryStatus(date, now = new Date()) {
  if (!date) return 'No expiry date'
  const expiry = new Date(`${date}T00:00:00`)
  if (Number.isNaN(expiry.getTime())) return 'No expiry date'
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.ceil((expiry - start) / 86400000)
  if (days < 0) return 'Expired'
  if (days <= 30) return 'Critical'
  if (days <= 60) return 'Warning'
  if (days <= 90) return 'Review'
  return 'Safe'
}

export const formatDate = (value) => value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '—'
