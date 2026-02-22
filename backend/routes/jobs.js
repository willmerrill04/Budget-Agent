const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all jobs with total expenses
router.get('/', (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*,
        COALESCE(SUM(e.amount), 0) AS total_expenses,
        j.quote_amount - COALESCE(SUM(e.amount), 0) AS profit
      FROM jobs j
      LEFT JOIN expenses e ON e.job_id = j.id
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `).all();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single job with expenses
router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT j.*,
        COALESCE(SUM(e.amount), 0) AS total_expenses,
        j.quote_amount - COALESCE(SUM(e.amount), 0) AS profit
      FROM jobs j
      LEFT JOIN expenses e ON e.job_id = j.id
      WHERE j.id = ?
      GROUP BY j.id
    `).get(req.params.id);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    const expenses = db.prepare(
      'SELECT * FROM expenses WHERE job_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    res.json({ ...job, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create job
router.post('/', (req, res) => {
  try {
    const { name, client_name, client_phone, job_description, status, quote_amount } = req.body;
    if (!name || !client_name || !client_phone) {
      return res.status(400).json({ error: 'name, client_name, and client_phone are required' });
    }
    const validStatuses = ['Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid'];
    const jobStatus = validStatuses.includes(status) ? status : 'Booked';

    const stmt = db.prepare(`
      INSERT INTO jobs (name, client_name, client_phone, job_description, status, quote_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name, client_name, client_phone,
      job_description || '', jobStatus, quote_amount || 0
    );
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...job, total_expenses: 0, profit: job.quote_amount, expenses: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update job
router.put('/:id', (req, res) => {
  try {
    const { name, client_name, client_phone, job_description, status, quote_amount } = req.body;
    const validStatuses = ['Booked', 'In Progress', 'Complete', 'Invoiced', 'Paid'];
    const jobStatus = validStatuses.includes(status) ? status : 'Booked';

    const stmt = db.prepare(`
      UPDATE jobs SET name = ?, client_name = ?, client_phone = ?,
        job_description = ?, status = ?, quote_amount = ?
      WHERE id = ?
    `);
    stmt.run(name, client_name, client_phone, job_description || '', jobStatus, quote_amount || 0, req.params.id);

    const job = db.prepare(`
      SELECT j.*,
        COALESCE(SUM(e.amount), 0) AS total_expenses,
        j.quote_amount - COALESCE(SUM(e.amount), 0) AS profit
      FROM jobs j
      LEFT JOIN expenses e ON e.job_id = j.id
      WHERE j.id = ?
      GROUP BY j.id
    `).get(req.params.id);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    const expenses = db.prepare(
      'SELECT * FROM expenses WHERE job_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    res.json({ ...job, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE job
router.delete('/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add expense to job
router.post('/:id/expenses', (req, res) => {
  try {
    const { description, amount } = req.body;
    if (!description || amount === undefined) {
      return res.status(400).json({ error: 'description and amount are required' });
    }
    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const stmt = db.prepare(
      'INSERT INTO expenses (job_id, description, amount) VALUES (?, ?, ?)'
    );
    const result = stmt.run(req.params.id, description, parseFloat(amount));
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE expense
router.delete('/:jobId/expenses/:expenseId', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND job_id = ?').get(
      req.params.expenseId, req.params.jobId
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.expenseId);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
