import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../api'
import '../App.css'

function daysSince(dateStr) {
  const called = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - called) / (1000 * 60 * 60 * 24))
  return diff
}

function formatCurrency(val) {
  if (val === null || val === undefined) return '$0'
  return '$' + Number(val).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const STATUS_ORDER = ['Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading...</div>
  if (!data) return <div className="loading">Error loading dashboard</div>

  const statusMap = {}
  STATUS_ORDER.forEach(s => { statusMap[s] = 0 })
  data.jobs_by_status.forEach(({ status, count }) => { statusMap[status] = count })

  const overdueLeads = data.overdue_leads || []
  const recentLeads = data.recent_leads || []
  const allUnconverted = [...overdueLeads, ...recentLeads]

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Active Jobs</span>
          <span className="stat-value">{data.active_jobs}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Profit</span>
          <span className="stat-value profit">
            {Number(data.total_profit_paid || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Jobs by status */}
      <div className="section-heading">Jobs by Status</div>
      <div className="card" style={{ padding: '12px 16px' }}>
        {STATUS_ORDER.map(status => (
          <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: status !== 'Paid' ? '1px solid var(--green-border)' : 'none' }}>
            <span className={`status-badge status-${status.replace(' ', '-')}`}>{status}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{statusMap[status] || 0}</span>
          </div>
        ))}
      </div>

      {/* Overdue leads */}
      {overdueLeads.length > 0 && (
        <>
          <div className="section-heading" style={{ color: 'var(--red)' }}>
            Needs Follow-up ({overdueLeads.length})
          </div>
          {overdueLeads.map(lead => {
            const days = daysSince(lead.called_date)
            return (
              <div key={lead.id} className="alert-card" onClick={() => navigate('/leads')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span className="lead-name">{lead.name}</span>
                  <span className="lead-days">{days}d ago</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--red)', opacity: 0.8 }}>
                  {lead.phone}
                  {lead.job_description ? ` · ${lead.job_description}` : ''}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Pending leads */}
      {recentLeads.length > 0 && (
        <>
          <div className="section-heading">Open Leads ({recentLeads.length})</div>
          {recentLeads.map(lead => {
            const days = daysSince(lead.called_date)
            return (
              <div key={lead.id} className="lead-card" onClick={() => navigate('/leads')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <span className="lead-name">{lead.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
                  </span>
                </div>
                <div className="lead-meta">{lead.phone}</div>
              </div>
            )
          })}
        </>
      )}

      {allUnconverted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
          No open leads
        </div>
      )}
    </div>
  )
}
