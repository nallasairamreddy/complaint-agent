import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchComplaint, resolveComplaint, submitFeedback } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react'

const PRIORITIES  = ['Low', 'Medium', 'High', 'Critical']
const DEPARTMENTS = ['General', 'Billing', 'Technical Support', 'Security']

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading]     = useState(true)

  const [fb, setFb]               = useState({ new_priority: '', new_department: '', escalation_reason: '' })
  const [fbResult, setFbResult]   = useState(null)  // stores the feedback response
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
    setFbResult(null)
    try {
      const { data } = await submitFeedback({ complaint_id: Number(id), ...fb })
      setFbResult(data)
      load()  // reload to show updated status
    } catch (e) {
      setFbError(e?.response?.data?.detail || 'Feedback failed.')
    } finally {
      setFbLoading(false)
    }
  }

  // Extract priority change from trace_log
  const getPriorityChange = (log) => {
    const match = log.match(/priority:\s*(\w+)\s*->\s*(\w+)/)
    return match ? { from: match[1], to: match[2] } : null
  }

  const priorityWillChange = fb.new_priority && fb.new_priority !== complaint?.priority

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm p-8">Loading...</div>
  )
  if (!complaint) return (
    <div className="p-8 text-signal-red text-sm">Complaint not found.</div>
  )

  const priorityChange = getPriorityChange(complaint.trace_log)

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
          <span className={`text-xs font-mono px-3 py-1.5 rounded-full border ${
            complaint.status === 'Resolved'  ? 'text-signal-green  border-signal-green/30  bg-signal-green/10'  :
            complaint.status === 'Escalated' ? 'text-signal-amber  border-signal-amber/30  bg-signal-amber/10'  :
            'text-slate-400 border-ink-600 bg-ink-700'
          }`}>{complaint.status}</span>
          {complaint.status === 'Pending' && (
            <button onClick={handleResolve}
              className="flex items-center gap-2 px-4 py-2 bg-signal-green/15 hover:bg-signal-green/25 border border-signal-green/30 text-signal-green rounded-lg text-sm font-display font-600 transition-all">
              <CheckCircle size={14} /> Resolve
            </button>
          )}
        </div>
      </div>

      {/* Priority Change History — shown only for escalated */}
      {complaint.status === 'Escalated' && priorityChange && (
        <div className="mb-6 bg-signal-amber/10 border border-signal-amber/30 rounded-xl px-5 py-4 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Priority Change History</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Original</p>
              <PriorityBadge priority={priorityChange.from} size="lg" />
            </div>
            <ArrowRight size={20} className="text-signal-amber" />
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Escalated To</p>
              <PriorityBadge priority={priorityChange.to} size="lg" />
            </div>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up opacity-0"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {[
          { label: 'Department',    value: complaint.department },
          { label: 'Utility Score', value: complaint.utility_score },
          { label: 'Sentiment',     value: complaint.sentiment_score },
          { label: 'Risk Keywords', value: complaint.risk_keywords || '—' },
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

      {/* Feedback Panel — only show if not already resolved/escalated */}
      {(complaint.status === 'Pending') && (
        <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up opacity-0"
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Operator Feedback</p>

          {/* Live preview of what will happen */}
          <p className={`text-xs mb-4 mt-1 font-mono ${priorityWillChange ? 'text-signal-amber' : 'text-signal-green'}`}>
            {priorityWillChange
              ? `⚡ Priority will change ${complaint.priority} → ${fb.new_priority} — Learning will be triggered`
              : `✓ No priority change — complaint will be marked Resolved`
            }
          </p>

          {fbResult ? (
            <div className={`flex flex-col gap-2 rounded-lg px-4 py-3 border text-sm ${
              fbResult.priority_changed
                ? 'bg-signal-amber/10 border-signal-amber/30 text-signal-amber'
                : 'bg-signal-green/10 border-signal-green/30 text-signal-green'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                {fbResult.priority_changed
                  ? `Escalated: ${fbResult.from_priority} → ${fbResult.to_priority}. Learning triggered.`
                  : `Resolved successfully. No learning triggered.`
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-1.5">
                    Priority
                    {priorityWillChange && (
                      <span className="ml-2 text-signal-amber">({complaint.priority} → {fb.new_priority})</span>
                    )}
                  </label>
                  <select value={fb.new_priority} onChange={e => setFb({ ...fb, new_priority: e.target.value })}
                    className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-1.5">Department</label>
                  <select value={fb.new_department} onChange={e => setFb({ ...fb, new_department: e.target.value })}
                    className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Reason — only required when priority changes */}
              {priorityWillChange && (
                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-1.5">
                    Escalation Reason <span className="text-signal-red">*</span>
                  </label>
                  <input type="text" value={fb.escalation_reason}
                    onChange={e => setFb({ ...fb, escalation_reason: e.target.value })}
                    placeholder="e.g. account breach detected"
                    className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
                </div>
              )}

              {fbError && (
                <div className="flex items-center gap-2 text-signal-red text-xs bg-signal-red/10 border border-signal-red/30 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} /> {fbError}
                </div>
              )}

              <button onClick={handleFeedback} disabled={fbLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-display font-600 transition-all disabled:opacity-50 ${
                  priorityWillChange
                    ? 'bg-signal-amber/15 hover:bg-signal-amber/25 border border-signal-amber/30 text-signal-amber'
                    : 'bg-signal-green/15 hover:bg-signal-green/25 border border-signal-green/30 text-signal-green'
                }`}>
                {fbLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {priorityWillChange ? 'Escalate & Learn' : 'Submit & Resolve'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Already resolved/escalated message */}
      {complaint.status !== 'Pending' && (
        <div className={`rounded-xl px-5 py-4 border text-sm font-mono animate-fade-up opacity-0 ${
          complaint.status === 'Resolved'
            ? 'bg-signal-green/10 border-signal-green/30 text-signal-green'
            : 'bg-signal-amber/10 border-signal-amber/30 text-signal-amber'
        }`} style={{ animationFillMode: 'forwards' }}>
          {complaint.status === 'Resolved'
            ? '✓ This complaint has been resolved.'
            : `⚡ This complaint was escalated. See priority change history above.`
          }
        </div>
      )}
    </div>
  )
}
