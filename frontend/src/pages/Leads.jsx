import { useEffect, useState } from 'react'
import { getLeads, createLead, deleteLead, convertLead, updateLead } from '../api'
import '../App.css'

function daysSince(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TABS = ['All', 'Open', 'Converted']

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [convertTarget, setConvertTarget] = useState(null)

  const load = () => {
    getLeads()
      .then(r => setLeads(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = leads.filter(l => {
    if (tab === 'Open') return !l.converted
    if (tab === 'Converted') return l.converted
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    await deleteLead(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Leads</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Lead</button>
      </div>

      <div className="filter-tabs">
        {TABS.map(t => (
          <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No leads yet. Add your first lead!</p>
        </div>
      )}

      {filtered.map(lead => {
        const days = daysSince(lead.called_date)
        const overdue = !lead.converted && days >= 3
        return (
          <div key={lead.id} className={`lead-card${overdue ? ' overdue' : ''}`}>
            <div className="card-row" style={{ marginBottom: 4 }}>
              <span className="lead-name">{lead.name}</span>
              {lead.converted
                ? <span className="converted-tag">✓ Converted</span>
                : overdue
                  ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{days}d ago</span>
                  : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
                    </span>
              }
            </div>
            <div className="lead-meta">
              <a href={`tel:${lead.phone}`} className="phone-link">{lead.phone}</a>
              {' · '}Called {formatDate(lead.called_date)}
            </div>
            {lead.job_description && (
              <div className="lead-description">{lead.job_description}</div>
            )}
            {!lead.converted && (
              <div className="lead-actions">
                <button className="btn btn-primary btn-sm" onClick={() => setConvertTarget(lead)}>
                  Convert to Job
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditLead(lead)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lead.id)}>Delete</button>
              </div>
            )}
          </div>
        )
      })}

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onSaved={(lead) => { setLeads(prev => [lead, ...prev]); setShowAdd(false) }}
        />
      )}

      {editLead && (
        <AddLeadModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSaved={(updated) => {
            setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
            setEditLead(null)
          }}
        />
      )}

      {convertTarget && (
        <ConvertModal
          lead={convertTarget}
          onClose={() => setConvertTarget(null)}
          onConverted={(job) => {
            setLeads(prev => prev.map(l => l.id === convertTarget.id ? { ...l, converted: 1 } : l))
            setConvertTarget(null)
          }}
        />
      )}
    </div>
  )
}

function AddLeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    job_description: lead?.job_description || '',
    called_date: lead?.called_date || new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.called_date) return alert('Name, phone and date are required')
    setSaving(true)
    try {
      let res
      if (lead) {
        res = await updateLead(lead.id, form)
      } else {
        res = await createLead(form)
      }
      onSaved(res.data)
    } catch (err) {
      alert('Error saving lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h3 className="modal-title">{lead ? 'Edit Lead' : 'Add New Lead'}</h3>

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" placeholder="Client name" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input className="form-input" type="tel" placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Date Called *</label>
          <input className="form-input" type="date" value={form.called_date} onChange={e => set('called_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Job Description</label>
          <textarea className="form-input" placeholder="What do they need done?" value={form.job_description} onChange={e => set('job_description', e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : lead ? 'Save Changes' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConvertModal({ lead, onClose, onConverted }) {
  const [form, setForm] = useState({
    name: `${lead.name} - Job`,
    job_description: lead.job_description || '',
    quote_amount: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name) return alert('Job name is required')
    setSaving(true)
    try {
      const res = await convertLead(lead.id, {
        name: form.name,
        job_description: form.job_description,
        quote_amount: parseFloat(form.quote_amount) || 0,
      })
      onConverted(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error converting lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h3 className="modal-title">Convert to Job</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          Converting lead for <strong>{lead.name}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Job Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Job Description</label>
          <textarea className="form-input" value={form.job_description} onChange={e => set('job_description', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Quote Amount ($)</label>
          <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.quote_amount} onChange={e => set('quote_amount', e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Converting...' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
