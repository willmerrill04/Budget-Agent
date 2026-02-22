import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJob, updateJob, deleteJob, addExpense, deleteExpense } from '../api'
import '../App.css'

const STATUSES = ['Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid']

function formatCurrency(val) {
  return '$' + Number(val || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showExpense, setShowExpense] = useState(false)

  const load = () => {
    getJob(id)
      .then(r => setJob(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleDeleteJob = async () => {
    if (!confirm(`Delete job "${job.name}"? This cannot be undone.`)) return
    await deleteJob(id)
    navigate('/jobs')
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Remove this expense?')) return
    await deleteExpense(id, expenseId)
    load()
  }

  const handleStatusChange = async (newStatus) => {
    const updated = await updateJob(id, { ...job, status: newStatus })
    setJob(updated.data)
  }

  if (loading) return <div className="loading">Loading job...</div>
  if (!job) return <div className="loading">Job not found</div>

  const profit = (job.quote_amount || 0) - (job.total_expenses || 0)
  const isNeg = profit < 0

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate('/jobs')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Jobs
      </button>

      {/* Job header */}
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)', flex: 1 }}>{job.name}</h2>
          <button className="btn btn-danger btn-sm" onClick={handleDeleteJob}>Delete</button>
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: 'var(--text-muted)' }}>
          <a href={`tel:${job.client_phone}`} className="phone-link">{job.client_name}</a>
          {' · '}<a href={`tel:${job.client_phone}`} className="phone-link">{job.client_phone}</a>
        </div>
      </div>

      {/* Status selector */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>Status</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`status-badge status-${s.replace(' ', '-')}`}
              style={{
                cursor: 'pointer',
                padding: '6px 14px',
                opacity: job.status === s ? 1 : 0.45,
                border: job.status === s ? '2px solid currentColor' : '1.5px solid transparent',
                transition: 'opacity 0.15s',
                minHeight: 36,
              }}
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job description */}
      {job.job_description && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="form-label" style={{ marginBottom: 4 }}>Description</div>
          <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.5 }}>{job.job_description}</p>
        </div>
      )}

      {/* Edit button */}
      <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setEditing(true)}>
        Edit Job Details
      </button>

      {/* Expenses section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="section-heading" style={{ margin: 0 }}>Expenses</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowExpense(true)}>+ Add Expense</button>
      </div>

      <div className="card">
        {(!job.expenses || job.expenses.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No expenses yet
          </div>
        ) : (
          job.expenses.map(exp => (
            <div key={exp.id} className="expense-item">
              <span className="expense-desc">{exp.description}</span>
              <span className="expense-amount">-{formatCurrency(exp.amount)}</span>
              <button className="expense-delete" onClick={() => handleDeleteExpense(exp.id)} title="Remove expense">×</button>
            </div>
          ))
        )}

        {/* Profit summary */}
        <div className="profit-box" style={{ marginTop: job.expenses?.length ? 12 : 0 }}>
          <div className="profit-box-row">
            <span>Quote</span>
            <span>{formatCurrency(job.quote_amount)}</span>
          </div>
          <div className="profit-box-row">
            <span>Total Expenses</span>
            <span style={{ color: 'var(--red)' }}>-{formatCurrency(job.total_expenses)}</span>
          </div>
          <div className={`profit-box-row total${isNeg ? ' negative' : ''}`}>
            <span>Profit</span>
            <span>{isNeg ? '-' : ''}{formatCurrency(Math.abs(profit))}</span>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditJobModal
          job={job}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setJob(updated); setEditing(false) }}
        />
      )}

      {/* Add expense modal */}
      {showExpense && (
        <AddExpenseModal
          jobId={id}
          onClose={() => setShowExpense(false)}
          onSaved={() => { load(); setShowExpense(false) }}
        />
      )}
    </div>
  )
}

function EditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: job.name || '',
    client_name: job.client_name || '',
    client_phone: job.client_phone || '',
    job_description: job.job_description || '',
    status: job.status || 'Booked',
    quote_amount: job.quote_amount || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.client_name || !form.client_phone) {
      return alert('Job name, client name, and phone are required')
    }
    setSaving(true)
    try {
      const res = await updateJob(job.id, { ...form, quote_amount: parseFloat(form.quote_amount) || 0 })
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
        <h3 className="modal-title">Edit Job</h3>

        <div className="form-group">
          <label className="form-label">Job Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Client Name *</label>
          <input className="form-input" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Client Phone *</label>
          <input className="form-input" type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Job Description</label>
          <textarea className="form-input" value={form.job_description} onChange={e => set('job_description', e.target.value)} />
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddExpenseModal({ jobId, onClose, onSaved }) {
  const [form, setForm] = useState({ description: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.description || !form.amount) return alert('Description and amount are required')
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) return alert('Please enter a valid amount')
    setSaving(true)
    try {
      await addExpense(jobId, { description: form.description, amount: amt })
      onSaved()
    } catch (err) {
      alert('Error adding expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h3 className="modal-title">Add Expense</h3>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <input className="form-input" placeholder="e.g. Timber from Bunnings" value={form.description} onChange={e => set('description', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Amount ($) *</label>
          <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
