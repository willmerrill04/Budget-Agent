import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Dashboard
export const getDashboard = () => api.get('/dashboard')

// Leads
export const getLeads = () => api.get('/leads')
export const createLead = (data) => api.post('/leads', data)
export const updateLead = (id, data) => api.put(`/leads/${id}`, data)
export const deleteLead = (id) => api.delete(`/leads/${id}`)
export const convertLead = (id, data) => api.post(`/leads/${id}/convert`, data)

// Jobs
export const getJobs = () => api.get('/jobs')
export const getJob = (id) => api.get(`/jobs/${id}`)
export const createJob = (data) => api.post('/jobs', data)
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data)
export const deleteJob = (id) => api.delete(`/jobs/${id}`)

// Expenses
export const addExpense = (jobId, data) => api.post(`/jobs/${jobId}/expenses`, data)
export const deleteExpense = (jobId, expenseId) => api.delete(`/jobs/${jobId}/expenses/${expenseId}`)
