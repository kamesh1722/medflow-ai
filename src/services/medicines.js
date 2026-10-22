import { api } from './api'

function normalizeMedicine(record) {
  return {
    ...record,
    id: String(record._id || record.id),
    expiryDate: record.expiryDate ? String(record.expiryDate).slice(0, 10) : '',
    updatedAt: record.updatedAt ? String(record.updatedAt).slice(0, 10) : '',
  }
}

function medicinePayload(record) {
  return Object.fromEntries(['name', 'category', 'quantity', 'minimumStock', 'expiryDate']
    .filter(key => record[key] !== undefined)
    .map(key => [key, record[key]]))
}

export async function getMedicines() {
  const { data } = await api.get('/medicines')
  if (!Array.isArray(data?.medicines)) throw new Error('The inventory service returned an unexpected response.')
  return data.medicines.map(normalizeMedicine)
}

export async function createMedicine(record) {
  const { data } = await api.post('/medicines', medicinePayload(record))
  return normalizeMedicine(data.medicine)
}

export async function updateMedicine(id, record) {
  const { data } = await api.put(`/medicines/${encodeURIComponent(id)}`, medicinePayload(record))
  return normalizeMedicine(data.medicine)
}

export async function removeMedicine(id) {
  await api.delete(`/medicines/${encodeURIComponent(id)}`)
}

export const inventoryErrorMessage = (error) => {
  if (error?.code === 'ERR_NETWORK') return 'Can’t reach the MedFlow API. Check that the backend is running and MongoDB is available.'
  return error?.response?.data?.message || error?.message || 'The inventory request could not be completed.'
}
