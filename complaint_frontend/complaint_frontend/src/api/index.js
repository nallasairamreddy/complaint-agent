import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Complaints
export const submitComplaint = (data) => api.post('/complaints/', data)
export const fetchComplaints = () => api.get('/complaints/')
export const fetchComplaint  = (id) => api.get(`/complaints/${id}`)
export const resolveComplaint = (id) => api.post(`/complaints/${id}/resolve`)

// Feedback / Learning
export const submitFeedback = (data) => api.post('/feedback/', data)

// Queue
export const fetchQueue    = () => api.get('/queue/')
export const fetchNextItem = () => api.get('/queue/next')
