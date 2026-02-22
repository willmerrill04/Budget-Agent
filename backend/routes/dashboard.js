const express = require('express');
const router = express.Router();
const db = require('../db');

// GET dashboard stats
router.get('/', (req, res) => {
  try {
    // Active jobs = Booked + In Progress + Complete + Invoiced (not Paid)
    const activeJobs = db.prepare(`
      SELECT COUNT(*) as count FROM jobs
      WHERE status NOT IN ('Paid')
    `).get();

    // Total profit across all Paid jobs
    const paidProfit = db.prepare(`
      SELECT COALESCE(SUM(j.quote_amount) - COALESCE(SUM(e.amount), 0), 0) as total_profit
      FROM jobs j
      LEFT JOIN expenses e ON e.job_id = j.id
      WHERE j.status = 'Paid'
    `).get();

    // Leads not followed up (not converted, called 3+ days ago)
    const overdueLeads = db.prepare(`
      SELECT * FROM leads
      WHERE converted = 0
        AND date(called_date) <= date('now', '-3 days')
      ORDER BY called_date ASC
    `).all();

    // Recent leads (not converted, less than 3 days)
    const recentLeads = db.prepare(`
      SELECT * FROM leads
      WHERE converted = 0
        AND date(called_date) > date('now', '-3 days')
      ORDER BY called_date DESC
    `).all();

    // Jobs by status breakdown
    const jobsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM jobs GROUP BY status
    `).all();

    res.json({
      active_jobs: activeJobs.count,
      total_profit_paid: paidProfit.total_profit,
      overdue_leads: overdueLeads,
      recent_leads: recentLeads,
      jobs_by_status: jobsByStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
