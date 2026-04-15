import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchComplaint, resolveComplaint, submitFeedback } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

const PRIORITIES   = ['Low', 'Medium', 'High', 'Critical']
const DEPARTMENTS  = ['General', 'Billing', 'Technical Support', 'Security']

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading]     = useState(true)

  // Feedback form
  const [fb, setFb]         = useState({ new_priority: '', new_department: '', escalation_reason: '' })
  const [fbSent, setFbSent] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [fbError, setFbError]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await fetchComplaint(id)
      setComplaint(data)
      setFb({ new_priority: data.priority, new_department: data.department, escalation_reason: '' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleResolve = async () => {
    await resolveComplaint(id)
    load()
  }

  const handleFeedback = async () => {
    setFbLoading(true)
    setFbError('')
    try {
      await submitFeedback({ complaint_id: Number(id), ...fb })
      setFbSent(true)
      load()
    } catch (e) {
      setFbError(e?.response?.data?.detail || 'Feedback failed.')
    } finally {
      setFbLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm p-8">Loading...</div>
  )
  if (!complaint) return (
    <div className="p-8 text-signal-red text-sm">Complaint not found.</div>
  )

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <p className="text-xs font-mono text-slate-600 mb-1">Complaint #{complaint.id}</p>
          <h1 className="font-display text-xl font-700 text-white">{complaint.customer_id}</h1>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={complaint.priority} size="lg" />
          {complaint.status !== 'Resolved' && (
            <button onClick={handleResolve}
              className="flex items-center gap-2 px-4 py-2 bg-signal-green/15 hover:bg-signal-green/25 border border-signal-green/30 text-signal-green rounded-lg text-sm font-display font-600 transition-all">
              <CheckCircle size={14} /> Resolve
            </button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {[
          { label: 'Department',     value: complaint.department },
          { label: 'Status',         value: complaint.status },
          { label: 'Utility Score',  value: complaint.utility_score },
          { label: 'Sentiment',      value: complaint.sentiment_score },
          { label: 'Risk Keywords',  value: complaint.risk_keywords || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-ink-900 border border-ink-700 rounded-lg p-4">
            <p className="text-xs font-mono text-slate-500 mb-1">{label}</p>
            <p className="text-sm text-white font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Complaint text */}
      <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 mb-6 animate-fade-up opacity-0"
        style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Complaint Text</p>
        <p className="text-slate-200 text-sm leading-relaxed">{complaint.text}</p>
      </div>

      {/* Trace log */}
      <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 mb-6 animate-fade-up opacity-0"
        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Agent Trace Log</p>
        <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">{complaint.trace_log}</pre>
      </div>

      {/* Feedback / Learning Panel */}
      <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up opacity-0"
        style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Operator Feedback (Learning)</p>

        {fbSent ? (
          <div className="flex items-center gap-2 text-signal-green text-sm">
            <CheckCircle size={16} /> Feedback submitted — agent has learned from this correction.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-500 block mb-1.5">Correct Priority</label>
                <select value={fb.new_priority} onChange={e => setFb({ ...fb, new_priority: e.target.value })}
                  className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors">
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-slate-500 block mb-1.5">Correct Department</label>
                <select value={fb.new_department} onChange={e => setFb({ ...fb, new_department: e.target.value })}
                  className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-500 block mb-1.5">Escalation Reason</label>
              <input type="text" value={fb.escalation_reason}
                onChange={e => setFb({ ...fb, escalation_reason: e.target.value })}
                placeholder="e.g. account breach detected"
                className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors font-body" />
            </div>
            {fbError && (
              <div className="flex items-center gap-2 text-signal-red text-xs bg-signal-red/10 border border-signal-red/30 rounded-lg px-3 py-2">
                <AlertTriangle size={12} /> {fbError}
              </div>
            )}
            <button onClick={handleFeedback} disabled={fbLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-signal-amber/15 hover:bg-signal-amber/25 border border-signal-amber/30 text-signal-amber rounded-lg text-sm font-display font-600 transition-all disabled:opacity-50">
              {fbLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
