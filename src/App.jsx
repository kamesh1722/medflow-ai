import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Activity, AlertCircle, AlertOctagon, AlertTriangle, ArrowDownUp, ArrowUpRight, Bell, Boxes, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock3, Download, LayoutDashboard, Menu, MoreHorizontal, Package, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { demoMedicines } from './data/demoMedicines'
import { expiryStatus, formatDate, stockStatus } from './utils/inventory'
import { createMedicine, getMedicines, inventoryErrorMessage, removeMedicine, updateMedicine } from './services/medicines.js'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const nav = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Medicine inventory', to: '/medicines', icon: Package },
  { label: 'Inventory management', to: '/inventory', icon: Boxes },
  { label: 'Expiry management', to: '/expiry', icon: Clock3 },
  { label: 'Stock alerts', to: '/alerts', icon: AlertTriangle },
  { label: 'Reports', to: '/reports', icon: ClipboardList },
]

const pageInfo = {
  '/': ['Inventory overview', 'Your healthcare inventory, organized and under control.'],
  '/medicines': ['Medicine inventory', 'Manage your medicine catalogue and stock records.'],
  '/inventory': ['Inventory management', 'Review availability and stock conditions across your catalogue.'],
  '/expiry': ['Expiry management', 'Keep upcoming expiry dates visible and actionable.'],
  '/alerts': ['Stock alerts', 'A focused view of medicines that need replenishment attention.'],
  '/reports': ['Reports & analytics', 'A live snapshot of the inventory records in this preview.'],
  '/settings': ['Settings', 'Application preferences for this preview.'],
}

const colors = ['#2563EB', '#F59E0B', '#DC2626']
const stockClass = (s) => s === 'Normal stock' ? 'good' : s === 'Low stock' ? 'warning' : 'critical'
const expiryClass = (s) => s === 'Safe' ? 'good' : s === 'Review' ? 'info' : s === 'Warning' ? 'warning' : 'critical'

function App() {
  return <Routes>
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="/*" element={<Workspace />} />
  </Routes>
}

function Workspace() {
  const [medicines, setMedicines] = useState(() => DEMO_MODE ? demoMedicines : [])
  const [inventoryStatus, setInventoryStatus] = useState(() => DEMO_MODE ? 'demo' : 'loading')
  const [inventoryError, setInventoryError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('All status')
  const [sort, setSort] = useState('name')
  const location = useLocation()
  const info = pageInfo[location.pathname] || pageInfo['/']
  const adminLabel = 'Administrator'
  const adminInitials = 'AD'

  const refreshMedicines = useCallback(async () => {
    if (DEMO_MODE) {
      setMedicines(demoMedicines)
      setInventoryStatus('demo')
      setInventoryError('')
      return true
    }
    setInventoryStatus('loading')
    setInventoryError('')
    try {
      setMedicines(await getMedicines())
      setInventoryStatus('live')
      return true
    } catch (error) {
      setInventoryStatus('error')
      setInventoryError(inventoryErrorMessage(error))
      return false
    }
  }, [])

  useEffect(() => { void refreshMedicines() }, [refreshMedicines])

  const visible = useMemo(() => medicines.filter(m => {
    const q = query.toLowerCase()
    const matches = `${m.name} ${m.category} ${m.id} ${m.batch || ''}`.toLowerCase().includes(q)
    return matches && (filter === 'All status' || stockStatus(m) === filter)
  }).sort((a, b) => sort === 'quantity' ? a.quantity - b.quantity : sort === 'expiry' ? (a.expiryDate || '').localeCompare(b.expiryDate || '') : a.name.localeCompare(b.name)), [medicines, query, filter, sort])

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const saveMedicine = async (record) => {
    if (DEMO_MODE) {
      setMedicines(current => record.id ? current.map(m => m.id === record.id ? record : m) : [{ ...record, id: `DEMO-${Date.now().toString().slice(-5)}` }, ...current])
      setModal(null)
      notify('Preview record saved in this session')
      return
    }
    if (record.id) await updateMedicine(record.id, record)
    else await createMedicine(record)
    await refreshMedicines()
    setModal(null)
    notify('Medicine record saved to the database')
  }
  const deleteMedicine = async (record) => {
    if (!window.confirm(`Delete ${record.name} from the medicine catalogue?`)) return false
    try {
      if (DEMO_MODE) setMedicines(current => current.filter(m => m.id !== record.id))
      else {
        await removeMedicine(record.id)
        await refreshMedicines()
      }
      notify(DEMO_MODE ? 'Preview record removed' : 'Medicine record deleted from the database')
      return true
    } catch (error) {
      notify(inventoryErrorMessage(error))
      return false
    }
  }

  return <div className="app-shell">
    {mobileOpen && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20} strokeWidth={2.5} /></div><span className="brand-name">MedFlow<span>AI</span></span><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close sidebar"><X size={19} /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><item.icon size={18} /><span>{item.label}</span>{item.to === '/alerts' && <span className="nav-count">3</span>}</NavLink>)}
      </nav>
      <div className="sidebar-bottom"><NavLink to="/settings" className={({ isActive }) => `nav-item settings-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}><Settings size={18} /><span>Settings</span></NavLink><div className="side-profile"><div className="avatar avatar-light">{adminInitials}</div><div className="profile-copy"><strong>{adminLabel}</strong><span>Workspace access</span></div></div></div>
      <button className="collapse-toggle" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{info[0]}</strong></div></div><div className="top-actions"><div className="top-search"><Search size={16} /><input aria-label="Search inventory" placeholder="Search anything..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => location.pathname !== '/alerts' && notify('You have 3 stock items needing attention')}><Bell size={18} /><i /></button><div className="top-divider" /><div className="user-chip" aria-label="Workspace access"><div className="avatar">{adminInitials}</div><span>{adminLabel}</span></div></div></header>
      <div className="page-wrap"><div className={`demo-banner ${inventoryStatus==='error'?'banner-error':''}`}><span className="demo-dot" /><strong>{DEMO_MODE?'Preview mode':inventoryStatus==='live'?'Live inventory':'Database status'}</strong><span>{DEMO_MODE?'Showing separate demonstration records. Changes stay in this browser session.':inventoryStatus==='live'?'Showing current medicine records from MongoDB.':inventoryStatus==='loading'?'Connecting to the inventory API…':'Live inventory could not be loaded.'}</span><button onClick={() => void refreshMedicines()}><Activity size={13}/><span>{inventoryStatus==='error'?'Retry':'Refresh'}</span></button></div>
        {inventoryError&&<div className="inventory-error" role="alert"><AlertCircle size={17}/><span>{inventoryError}</span><button onClick={()=>void refreshMedicines()}>Try again</button></div>}
        <div className="page-heading"><div><div className="eyebrow"><Sparkles size={13} /> MEDFLOW AI <span>/</span> INVENTORY INTELLIGENCE</div><h1>{info[0]}</h1><p>{info[1]}</p></div><div className="heading-actions"><span className="date-chip"><Clock3 size={15} /> {new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span>{location.pathname === '/medicines' && <button className="button primary" onClick={() => setModal({ mode: 'add' })}><Plus size={17} /> Add medicine</button>}</div></div>
        {inventoryStatus==='loading' ? <div className="inventory-loading" role="status"><span className="inventory-spinner"/> Loading current inventory data from MongoDB…</div> : <Routes>
          <Route path="/" element={<Dashboard medicines={medicines} onOpen={setModal} />} />
          <Route path="/medicines" element={<Medicines medicines={visible} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} onAdd={() => setModal({ mode: 'add' })} onEdit={m => setModal({ mode: 'edit', medicine: m })} onDelete={deleteMedicine} onRefresh={refreshMedicines} />} />
          <Route path="/inventory" element={<Inventory medicines={visible} onEdit={m => setModal({ mode: 'edit', medicine: m })} />} />
          <Route path="/expiry" element={<Expiry medicines={medicines} query={query} />} />
          <Route path="/alerts" element={<Alerts medicines={medicines} />} />
          <Route path="/reports" element={<Reports medicines={medicines} />} />
          <Route path="/settings" element={<ModuleEmpty icon={Settings} title="No settings are configured yet" description="This preview does not include persisted user preferences. Settings will appear when the application’s account and preference APIs are defined." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>}
        <footer className="page-footer"><span>© 2026 MedFlow AI</span><span>Inventory intelligence for healthcare</span><span className="footer-status"><i /> {inventoryStatus==='live'?'MongoDB connected':inventoryStatus==='demo'?'Demo data only':inventoryStatus==='loading'?'Connecting to API':'API unavailable'}</span></footer>
      </div>
    </main>
    {modal && <MedicineModal mode={modal.mode} medicine={modal.medicine} demoMode={DEMO_MODE} onClose={() => setModal(null)} onSave={saveMedicine} onDelete={deleteMedicine} />}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </div>
}

function StatCard({ icon: Icon, label, value, note, tone, tint }) {
  return <div className="stat-card"><div className={`stat-icon ${tint}`}><Icon size={19} /></div><div className="stat-top"><span>{label}</span><MoreHorizontal size={17} /></div><strong className="stat-value">{value}</strong><div className="stat-note">{note}</div><div className={`stat-accent ${tone}`} /></div>
}

function Dashboard({ medicines, onOpen }) {
  const normal = medicines.filter(m => stockStatus(m) === 'Normal stock').length
  const low = medicines.filter(m => stockStatus(m) === 'Low stock').length
  const out = medicines.filter(m => stockStatus(m) === 'Out of stock').length
  const lowItems = medicines.filter(m => stockStatus(m) !== 'Normal stock').sort((a,b) => a.quantity-b.quantity).slice(0, 5)
  const attention = medicines.filter(m => ['Expired','Critical','Warning','Review'].includes(expiryStatus(m.expiryDate))).sort((a,b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0,4)
  const distribution = [{ name: 'Normal stock', value: normal }, { name: 'Low stock', value: low }, { name: 'Out of stock', value: out }]
  return <>
    <div className="welcome-strip"><div className="welcome-icon"><ShieldCheck size={21} /></div><div><strong>Inventory at a glance</strong><p>Here’s your inventory health at a glance. <b>{medicines.length} medicine records</b> are in the catalogue.</p></div><div className="welcome-date">LIVE INVENTORY SNAPSHOT <span>·</span> TODAY</div></div>
    <section className="stat-grid">
      <StatCard icon={Package} label="Total medicines" value={medicines.length.toLocaleString()} note="Unique catalogue records" tint="blue-tint" tone="blue" />
      <StatCard icon={Boxes} label="Available stock units" value={medicines.reduce((sum,m) => sum + Number(m.quantity || 0), 0).toLocaleString()} note="Across all medicine records" tint="cyan-tint" tone="cyan" />
      <StatCard icon={AlertTriangle} label="Low-stock items" value={low.toString().padStart(2,'0')} note="At or below minimum level" tint="amber-tint" tone="amber" />
      <StatCard icon={AlertOctagon} label="Critical shortages" value={out.toString().padStart(2,'0')} note="Out of stock · quantity ≤ 0" tint="red-tint" tone="red" />
    </section>
    <section className="dashboard-grid top-dash-grid">
      <div className="panel distribution-panel"><PanelTitle title="Stock distribution" subtitle="Current medicine records by stock status" trailing={<span className="subtle-pill"><span className="live-dot"/> Live snapshot</span>} />
        <div className="distribution-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="92%" paddingAngle={4} stroke="none" cornerRadius={4}>{distribution.map((entry,i)=><Cell key={entry.name} fill={colors[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{medicines.length}</strong><span>MEDICINES</span></div></div><div className="legend-list">{distribution.map((item,i)=><div className="legend-row" key={item.name}><i style={{background:colors[i]}}/><span>{item.name}</span><strong>{item.value}</strong><em>{medicines.length ? `${Math.round(item.value/medicines.length*100)}%` : '0%'}</em></div>)}</div></div>
        <div className="chart-footnote"><span><Activity size={14} /> Stock status uses catalogue minimum levels</span><a href="/inventory">View inventory <ArrowUpRight size={13} /></a></div>
      </div>
      <div className="panel health-panel"><PanelTitle title="Expiry overview" subtitle="Records with an expiry date in the next 90 days" trailing={<span className="tiny-badge">{attention.length} to review</span>} />
        {attention.length ? <div className="expiry-preview">{attention.map(m=><div className="expiry-row" key={m.id}><div className={`expiry-symbol ${expiryClass(expiryStatus(m.expiryDate))}`}><Clock3 size={16}/></div><div className="expiry-name"><strong>{m.name}</strong><span>{m.batch || m.id}</span></div><div className="expiry-date"><strong>{formatDate(m.expiryDate)}</strong><span>{expiryStatus(m.expiryDate)}</span></div><span className={`status-badge ${expiryClass(expiryStatus(m.expiryDate))}`}>{expiryStatus(m.expiryDate)}</span></div>)}</div> : <EmptyState icon={Check} title="No expiry dates need attention" detail="Records beyond the 90-day review window are not shown here." />}
        <div className="health-footer"><div className="health-icon"><ShieldCheck size={17}/></div><span>Expiry categories are calculated from today’s date.</span><NavLink to="/expiry">View all</NavLink></div>
      </div>
    </section>
    <section className="dashboard-grid bottom-dash-grid">
      <div className="panel table-panel"><PanelTitle title="Stock needs attention" subtitle="Medicines at or below their minimum stock level" trailing={<NavLink className="text-link" to="/alerts">All alerts <ArrowUpRight size={14}/></NavLink>} />
        {lowItems.length ? <MedicineTable medicines={lowItems} compact /> : <EmptyState icon={Check} title="Stock levels look healthy" detail="No medicine records are currently below their minimum level." />}
      </div>
      <div className="panel coverage-panel"><PanelTitle title="Inventory summary" subtitle="Quantities represented in this catalogue" />
        <div className="summary-stat"><div className="summary-orbit"><Boxes size={22}/></div><div><strong>{medicines.reduce((sum,m)=>sum+Number(m.quantity||0),0).toLocaleString()}</strong><span>Total units available</span></div></div>
        <div className="summary-breakdown"><div><span>Catalogue records</span><strong>{medicines.length}</strong></div><div><span>Records with expiry date</span><strong>{medicines.filter(m=>m.expiryDate).length}</strong></div><div><span>Normal stock records</span><strong>{normal}</strong></div></div>
        <div className="summary-callout"><Sparkles size={15}/><span>Summary values update from the displayed inventory records.</span></div>
      </div>
    </section>
  </>
}

function PanelTitle({ title, subtitle, trailing }) { return <div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{trailing}</div> }

function MedicineTable({ medicines, compact=false, onEdit, onDelete }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>MEDICINE</th><th>CATEGORY</th><th>AVAILABLE</th><th>MIN. STOCK</th><th>EXPIRY DATE</th><th>STATUS</th>{!compact && <th></th>}</tr></thead><tbody>{medicines.map((m,i)=><tr key={m.id}><td><div className="medicine-cell"><div className={`med-avatar med-${i%5}`}><Package size={16}/></div><div><strong>{m.name}</strong><span>{m.id}{m.batch ? ` · ${m.batch}` : ''}</span></div></div></td><td><span className="category-text">{m.category}</span></td><td><strong className="quantity">{m.quantity}<small> units</small></strong></td><td>{m.minimumStock}</td><td>{formatDate(m.expiryDate)}</td><td><span className={`status-badge ${stockClass(stockStatus(m))}`}><i />{stockStatus(m)}</span></td>{!compact && <td><button className="row-action" onClick={()=>onEdit?.(m)} aria-label={`Edit ${m.name}`}><MoreHorizontal size={18}/><span className="sr-only">Edit</span></button></td>}</tr>)}</tbody></table></div>
}

function Medicines({ medicines, query, setQuery, filter, setFilter, sort, setSort, onAdd, onEdit, onDelete, onRefresh }) {
  return <section className="panel inventory-panel"><div className="toolbar"><div className="toolbar-search"><Search size={16}/><input placeholder="Search by medicine, category or ID..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>/</kbd></div><div className="toolbar-controls"><label className="select-wrap"><SlidersHorizontal size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All status</option><option>Normal stock</option><option>Low stock</option><option>Out of stock</option></select><ChevronDown size={14}/></label><label className="select-wrap"><ArrowDownUp size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Name A–Z</option><option value="quantity">Lowest quantity</option><option value="expiry">Expiry date</option></select><ChevronDown size={14}/></label><button className="button outline" onClick={()=>void onRefresh()}><Activity size={15}/> Refresh</button></div></div>
    <div className="table-caption"><span><strong>{medicines.length}</strong> medicine records</span><span>Showing demonstration data</span></div>
    {medicines.length ? <MedicineTable medicines={medicines} onEdit={onEdit} onDelete={onDelete} /> : <EmptyState icon={Search} title="No medicines found" detail="Try a different search term or adjust the status filter." action={<button className="button outline" onClick={()=>{setQuery('');setFilter('All status')}}>Clear filters</button>} />}
    <div className="table-pagination"><span>Showing <strong>{medicines.length ? 1 : 0}–{medicines.length}</strong> of <strong>{medicines.length}</strong> results</span><div><button disabled aria-label="Previous page"><ChevronLeft size={16}/></button><button className="page-current">1</button><button disabled aria-label="Next page"><ChevronRight size={16}/></button></div></div>
    </section>
}

function Inventory({ medicines, onEdit }) {
  return <><div className="mini-metrics"><div><span>Inventory records</span><strong>{medicines.length}</strong><Package size={18}/></div><div><span>Low / out of stock</span><strong>{medicines.filter(m=>stockStatus(m)!=='Normal stock').length}</strong><AlertTriangle size={18}/></div><div><span>Total available units</span><strong>{medicines.reduce((s,m)=>s+Number(m.quantity),0).toLocaleString()}</strong><Boxes size={18}/></div></div><section className="panel inventory-panel"><PanelTitle title="Stock ledger" subtitle="Available quantity, minimum level and last recorded update" trailing={<span className="subtle-pill">Demo records</span>} /><div className="table-scroll"><table className="data-table"><thead><tr><th>MEDICINE</th><th>AVAILABLE QUANTITY</th><th>MINIMUM LEVEL</th><th>LAST UPDATED</th><th>STOCK STATUS</th><th></th></tr></thead><tbody>{medicines.map((m,i)=><tr key={m.id}><td><div className="medicine-cell"><div className={`med-avatar med-${i%5}`}><Package size={16}/></div><div><strong>{m.name}</strong><span>{m.id} · {m.category}</span></div></div></td><td><strong className="quantity">{m.quantity}<small> units</small></strong><div className="quantity-track"><i className={stockClass(stockStatus(m))} style={{width:`${Math.min(100, m.minimumStock ? m.quantity/(m.minimumStock*2)*100 : 100)}%`}}/></div></td><td>{m.minimumStock} units</td><td>{formatDate(m.updatedAt)}</td><td><span className={`status-badge ${stockClass(stockStatus(m))}`}><i/>{stockStatus(m)}</span></td><td><button className="button small outline" onClick={()=>onEdit(m)}>Update stock</button></td></tr>)}</tbody></table></div></section></>
}

function Expiry({ medicines, query }) {
  const records = medicines.filter(m => m.expiryDate && m.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate))
  const categories = ['Expired','Critical','Warning','Review','Safe']
  return <><div className="expiry-metrics">{categories.map((status,i)=><div className={`expiry-metric ${expiryClass(status)}`} key={status}><div className="metric-icon">{i===0?<AlertOctagon size={17}/>:<Clock3 size={17}/>}</div><span>{status}</span><strong>{records.filter(m=>expiryStatus(m.expiryDate)===status).length}</strong><small>{status==='Expired'?'Past date':status==='Critical'?'≤ 30 days':status==='Warning'?'31–60 days':status==='Review'?'61–90 days':'More than 90 days'}</small></div>)}</div>
    <section className="panel inventory-panel"><PanelTitle title="Expiry schedule" subtitle="Sorted by earliest expiry date · based on calendar days" trailing={<span className="subtle-pill"><Clock3 size={13}/> Date calculated today</span>}/>{records.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>MEDICINE</th><th>BATCH</th><th>QUANTITY</th><th>EXPIRY DATE</th><th>TIME REMAINING</th><th>EXPIRY STATUS</th></tr></thead><tbody>{records.map((m,i)=>{const status=expiryStatus(m.expiryDate);const days=Math.ceil((new Date(`${m.expiryDate}T00:00:00`)-new Date(new Date().setHours(0,0,0,0)))/86400000);return <tr key={m.id}><td><div className="medicine-cell"><div className={`med-avatar med-${i%5}`}><Package size={16}/></div><div><strong>{m.name}</strong><span>{m.id} · {m.category}</span></div></div></td><td>{m.batch||'—'}</td><td><strong>{m.quantity}</strong> units</td><td>{formatDate(m.expiryDate)}</td><td>{days<0?`${Math.abs(days)} days ago`:`${days} days`}</td><td><span className={`status-badge ${expiryClass(status)}`}><i/>{status}</span></td></tr>})}</tbody></table></div>:<EmptyState icon={Clock3} title="No expiry dates to show" detail="There are no matching records with expiry dates."/>}</section></>
}

function Alerts({ medicines }) {
  const alertItems=medicines.filter(m=>stockStatus(m)!=='Normal stock').sort((a,b)=>a.quantity-b.quantity)
  return <><div className="alert-banner"><div className="alert-banner-icon"><AlertTriangle size={20}/></div><div><strong>{alertItems.length} stock records need your attention</strong><span>Quantities are compared directly with each medicine’s minimum stock level.</span></div><div className="alert-banner-count"><b>{medicines.filter(m=>m.quantity<=0).length}</b><small>OUT OF STOCK</small></div></div><section className="panel inventory-panel"><PanelTitle title="Replenishment attention" subtitle="Sorted by lowest current quantity" trailing={<span className="subtle-pill">{alertItems.length} records</span>}/>{alertItems.length?<div className="table-scroll"><table className="data-table"><thead><tr><th>MEDICINE</th><th>AVAILABLE</th><th>MIN. STOCK</th><th>GAP TO MINIMUM</th><th>SEVERITY</th><th></th></tr></thead><tbody>{alertItems.map((m,i)=>{const gap=Math.max(0,m.minimumStock-m.quantity);return <tr key={m.id}><td><div className="medicine-cell"><div className={`med-avatar med-${i%5}`}><Package size={16}/></div><div><strong>{m.name}</strong><span>{m.id} · {m.category}</span></div></div></td><td><strong className="quantity">{m.quantity}</strong> units</td><td>{m.minimumStock} units</td><td><span className="gap-value">{gap} units</span></td><td><span className={`status-badge ${stockClass(stockStatus(m))}`}><i/>{stockStatus(m)}</span></td><td><NavLink className="text-link" to="/medicines">View record <ArrowUpRight size={13}/></NavLink></td></tr>})}</tbody></table></div>:<EmptyState icon={Check} title="No stock alerts" detail="All medicine quantities are above their minimum stock levels."/>}</section></>
}

function Reports({ medicines }) {
  const categories=Object.entries(medicines.reduce((acc,m)=>(acc[m.category]=(acc[m.category]||0)+1,acc),{})).map(([name,records])=>({name,records}))
  const stock=[{name:'Normal',value:medicines.filter(m=>stockStatus(m)==='Normal stock').length},{name:'Low',value:medicines.filter(m=>stockStatus(m)==='Low stock').length},{name:'Out',value:medicines.filter(m=>stockStatus(m)==='Out of stock').length}]
  const expiryCounts=['Expired','Critical','Warning','Review','Safe'].map(status=>({status,count:medicines.filter(m=>expiryStatus(m.expiryDate)===status).length}))
  const csv=()=>{const rows=[['Medicine','Category','Quantity','Minimum stock','Stock status','Expiry date','Batch'],...medicines.map(m=>[m.name,m.category,m.quantity,m.minimumStock,stockStatus(m),m.expiryDate||'',m.batch||''])];const content=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/csv'}));a.download='medflow-inventory-preview.csv';a.click();URL.revokeObjectURL(a.href)}
  return <><div className="reports-heading"><div><span className="report-kicker"><Activity size={14}/> INVENTORY DATASET</span><h2>Inventory snapshot</h2><p>Current catalogue counts only. No historical transactions are included.</p></div><button className="button outline" onClick={csv}><Download size={15}/> Export CSV</button></div><div className="report-cards"><div className="panel report-stock"><PanelTitle title="Stock distribution" subtitle="Number of medicine records"/><div className="report-stock-content"><div className="report-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stock} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={4} stroke="none">{stock.map((s,i)=><Cell key={s.name} fill={colors[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{medicines.length}</strong><span>RECORDS</span></div></div><div className="legend-list">{stock.map((s,i)=><div className="legend-row" key={s.name}><i style={{background:colors[i]}}/><span>{s.name} stock</span><strong>{s.value}</strong></div>)}</div></div></div><div className="panel category-report"><PanelTitle title="Catalogue by category" subtitle="Current medicine records"/><div className="category-bars">{categories.map((c,i)=><div className="category-bar" key={c.name}><div><span>{c.name}</span><strong>{c.records}</strong></div><div className="bar-track"><i style={{width:`${Math.max(7,c.records/medicines.length*100)}%`,background:['#2563EB','#18A9C1','#7C73F2','#38A37A','#EC9B43','#5265C5'][i%6]}}/></div></div>)}</div></div></div><div className="report-cards lower-report"><div className="panel expiry-report"><PanelTitle title="Expiry status" subtitle="From records that include an expiry date"/><div className="expiry-bars">{expiryCounts.map(x=><div key={x.status}><span className={`status-badge ${expiryClass(x.status)}`}>{x.status}</span><div className="bar-track"><i style={{width:`${medicines.length?Math.max(x.count?7:0,x.count/medicines.length*100):0}%`}}/></div><strong>{x.count}</strong></div>)}</div></div><div className="panel report-summary"><PanelTitle title="Dataset summary" subtitle="Calculated from displayed records"/><div className="summary-breakdown"><div><span>Total medicine records</span><strong>{medicines.length}</strong></div><div><span>Available stock units</span><strong>{medicines.reduce((s,m)=>s+Number(m.quantity),0).toLocaleString()}</strong></div><div><span>Low stock or out of stock</span><strong>{medicines.filter(m=>stockStatus(m)!=='Normal stock').length}</strong></div><div><span>Records with expiry date</span><strong>{medicines.filter(m=>m.expiryDate).length}</strong></div></div></div></div></>
}

function ModuleEmpty({ icon: Icon, title, description }) { return <section className="panel module-empty"><div className="empty-icon"><Icon size={25}/></div><h2>{title}</h2><p>{description}</p><span className="subtle-pill">Preview module · no connected data</span></section> }
function EmptyState({ icon: Icon, title, detail, action }) { return <div className="empty-state"><div className="empty-icon"><Icon size={21}/></div><strong>{title}</strong><p>{detail}</p>{action}</div> }

function MedicineModal({ mode, medicine, onClose, onSave, onDelete }) {
  const [form,setForm]=useState(medicine||{name:'',category:'',quantity:'',minimumStock:'',expiryDate:''})
  const [error,setError]=useState('')
  const [saving,setSaving]=useState(false)
  const change=(key,value)=>setForm(current=>({...current,[key]:value}))
  const submit=async(e)=>{e.preventDefault();setError('');if(!form.name.trim()||!form.category.trim())return setError('Medicine name and category are required.');if(form.quantity===''||Number(form.quantity)<0||!Number.isFinite(Number(form.quantity)))return setError('Quantity must be zero or a positive number.');if(form.minimumStock===''||Number(form.minimumStock)<0||!Number.isFinite(Number(form.minimumStock)))return setError('Minimum stock must be zero or a positive number.');setSaving(true);try{await onSave({...form,quantity:Number(form.quantity),minimumStock:Number(form.minimumStock),expiryDate:form.expiryDate||null})}catch(error){setError(inventoryErrorMessage(error))}finally{setSaving(false)}}
  const remove=async()=>{const removed=await onDelete(medicine);if(removed)onClose()}
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&!saving&&onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">{DEMO_MODE?'DEMONSTRATION DATA':'LIVE DATABASE RECORD'}</span><h2 id="modal-title">{mode==='edit'?'Edit medicine':'Add medicine'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close" disabled={saving}><X size={19}/></button></div><p className="modal-note">{DEMO_MODE?'Changes stay in this browser session and are not sent to MongoDB.':'Changes are validated and saved to the connected MongoDB database.'}</p><form onSubmit={submit}><div className="form-grid"><label className="field full"><span>Medicine name <b>*</b></span><input autoFocus value={form.name} onChange={e=>change('name',e.target.value)} placeholder="e.g. Amoxicillin 500 mg" required disabled={saving}/></label><label className="field"><span>Category <b>*</b></span><input value={form.category} onChange={e=>change('category',e.target.value)} placeholder="e.g. Antibiotic" required disabled={saving}/></label><label className="field"><span>Available quantity <b>*</b></span><input type="number" min="0" step="1" value={form.quantity} onChange={e=>change('quantity',e.target.value)} required disabled={saving}/></label><label className="field"><span>Minimum stock level <b>*</b></span><input type="number" min="0" step="1" value={form.minimumStock} onChange={e=>change('minimumStock',e.target.value)} required disabled={saving}/></label><label className="field"><span>Expiry date</span><input type="date" value={form.expiryDate||''} onChange={e=>change('expiryDate',e.target.value)} disabled={saving}/></label></div>{error&&<div className="form-error" role="alert"><AlertTriangle size={15}/>{error}</div>}<div className="modal-actions">{mode==='edit'&&<button type="button" className="button danger-button" onClick={()=>void remove()} disabled={saving}>Delete record</button>}<button type="button" className="button outline" onClick={onClose} disabled={saving}>Cancel</button><button className="button primary" type="submit" disabled={saving}>{saving?<><span className="button-spinner"/> Saving…</>:<><Check size={16}/>{mode==='edit'?'Save changes':'Add medicine'}</>}</button></div></form></section></div>
}

export default App
