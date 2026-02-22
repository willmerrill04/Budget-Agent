const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all leads
router.get('/', (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create lead
router.post('/', (req, res) => {
  try {
    const { name, phone, job_description, called_date } = req.body;
    if (!name || !phone || !called_date) {
      return res.status(400).json({ error: 'name, phone, and called_date are required' });
    }
    const stmt = db.prepare(
      'INSERT INTO leads (name, phone, job_description, called_date) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, phone, job_description || '', called_date);
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update lead
router.put('/:id', (req, res) => {
  try {
    const { name, phone, job_description, called_date } = req.body;
    const stmt = db.prepare(
      'UPDATE leads SET name = ?, phone = ?, job_description = ?, called_date = ? WHERE id = ?'
    );
    stmt.run(name, phone, job_description || '', called_date, req.params.id);
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE lead
router.delete('/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST convert lead to job
router.post('/:id/convert', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (lead.converted) return res.status(400).json({ error: 'Lead already converted' });

    const { name, job_description, quote_amount } = req.body;
    const jobName = name || `${lead.name} - Job`;

    const stmt = db.prepare(`
      INSERT INTO jobs (name, client_name, client_phone, job_description, status, quote_amount, lead_id)
      VALUES (?, ?, ?, ?, 'Booked', ?, ?)
    `);
    const result = stmt.run(
      jobName,
      lead.name,
      lead.phone,
      job_description || lead.job_description,
      quote_amount || 0,
      lead.id
    );

    db.prepare('UPDATE leads SET converted = 1 WHERE id = ?').run(lead.id);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
