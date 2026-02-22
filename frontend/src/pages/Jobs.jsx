import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, createJob } from '../api'
import '../App.css'

const STATUSES = ['All', 'Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid']

function formatCurrency(val) {
  return '$' + Number(val || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    getJobs()
      .then(r => setJobs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = statusFilter === 'All'
    ? jobs
    : jobs.filter(j => j.status === statusFilter)

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Jobs</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Job</button>
      </div>

      <div className="filter-tabs">
        {STATUSES.map(s => (
          <button key={s} className={`filter-tab${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔨</div>
          <p>No jobs{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}. Add your first job!</p>
        </div>
      )}

      {filtered.map(job => {
        const profit = (job.quote_amount || 0) - (job.total_expenses || 0)
        const isNeg = profit < 0
        return (
          <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
            <div className="job-card-header">
              <span className="job-name">{job.name}</span>
              <span className={`status-badge status-${job.status.replace(' ', '-')}`}>{job.status}</span>
            </div>
            <div className="job-client">{job.client_name} · {job.client_phone}</div>
            {job.job_description && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, opacity: 0.85 }}>
                {job.job_description}
              </div>
            )}
            <div className="job-financials">
              <span className="job-quote">Quote: {formatCurrency(job.quote_amount)}</span>
              <span className="job-quote">Expenses: {formatCurrency(job.total_expenses)}</span>
              <span className={`job-profit${isNeg ? ' negative' : ''}`}>
                Profit: {isNeg ? '-' : ''}{formatCurrency(Math.abs(profit))}
              </span>
            </div>
          </div>
        )
      })}

      {showAdd && (
        <AddJobModal
          onClose={() => setShowAdd(false)}
          onSaved={(job) => { setJobs(prev => [job, ...prev]); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

export function AddJobModal({ onClose, onSaved, initialData }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    client_name: initialData?.client_name || '',
    client_phone: initialData?.client_phone || '',
    job_description: initialData?.job_description || '',
    status: initialData?.status || 'Booked',
    quote_amount: initialData?.quote_amount || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.client_name || !form.client_phone) {
      return alert('Job name, client name, and phone are required')
    }
    setSaving(true)
    try {
      const res = await createJob({ ...form, quote_amount: parseFloat(form.quote_amount) || 0 })
      onSaved(res.data)
    } catch (err) {
      alert('Error saving job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h3 className="modal-title">Add New Job</h3>

        <div className="form-group">
          <label className="form-label">Job Name *</label>
          <input className="form-input" placeholder="e.g. Kitchen Cabinets - Smith" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Client Name *</label>
          <input className="form-input" placeholder="Client full name" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Client Phone *</label>
          <input className="form-input" type="tel" placeholder="Phone number" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Job Description</label>
          <textarea className="form-input" placeholder="What needs to be done?" value={form.job_description} onChange={e => set('job_description', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            {['Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Quote Amount ($)</label>
          <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.quote_amount} onChange={e => set('quote_amount', e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
