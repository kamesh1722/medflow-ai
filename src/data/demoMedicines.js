// Clearly labeled preview records; replace this module with API-backed state when the server is available.
const today = new Date()
const dateIn = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10) }

export const demoMedicines = [
  { id: 'MED-1042', name: 'Amoxicillin 500 mg', category: 'Antibiotic', quantity: 148, minimumStock: 40, expiryDate: dateIn(241), batch: 'AMX-24-081', supplier: 'Northstar Pharma', updatedAt: dateIn(-2) },
  { id: 'MED-1038', name: 'Paracetamol 500 mg', category: 'Analgesic', quantity: 24, minimumStock: 30, expiryDate: dateIn(44), batch: 'PCM-24-126', supplier: 'CuraMed Distribution', updatedAt: dateIn(-1) },
  { id: 'MED-1029', name: 'Insulin glargine', category: 'Endocrine', quantity: 0, minimumStock: 12, expiryDate: dateIn(83), batch: 'INS-23-044', supplier: 'Northstar Pharma', updatedAt: dateIn(-4) },
  { id: 'MED-1014', name: 'Ceftriaxone 1 g', category: 'Antibiotic', quantity: 8, minimumStock: 24, expiryDate: dateIn(18), batch: 'CEF-24-307', supplier: 'Meridian Medical', updatedAt: dateIn(-1) },
  { id: 'MED-1008', name: 'Salbutamol inhaler', category: 'Respiratory', quantity: 67, minimumStock: 20, expiryDate: dateIn(122), batch: 'SAL-25-019', supplier: 'CuraMed Distribution', updatedAt: dateIn(-3) },
  { id: 'MED-0992', name: 'Omeprazole 20 mg', category: 'Gastrointestinal', quantity: 18, minimumStock: 20, expiryDate: dateIn(-7), batch: 'OMP-23-651', supplier: 'Meridian Medical', updatedAt: dateIn(-6) },
  { id: 'MED-0983', name: 'Atorvastatin 10 mg', category: 'Cardiovascular', quantity: 92, minimumStock: 25, expiryDate: dateIn(320), batch: 'ATV-25-060', supplier: 'Northstar Pharma', updatedAt: dateIn(-5) },
  { id: 'MED-0975', name: 'Metformin 500 mg', category: 'Endocrine', quantity: 21, minimumStock: 24, expiryDate: dateIn(68), batch: 'MET-24-332', supplier: 'CuraMed Distribution', updatedAt: dateIn(-2) },
  { id: 'MED-0961', name: 'Azithromycin 250 mg', category: 'Antibiotic', quantity: 56, minimumStock: 18, expiryDate: dateIn(12), batch: 'AZI-24-158', supplier: 'Meridian Medical', updatedAt: dateIn(-8) },
]
