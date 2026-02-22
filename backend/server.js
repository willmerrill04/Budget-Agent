const express = require('express');
const cors = require('cors');
const path = require('path');

const leadsRouter = require('./routes/leads');
const jobsRouter = require('./routes/jobs');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/leads', leadsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/dashboard', dashboardRouter);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Carpentry App backend running on http://localhost:${PORT}`);
});
