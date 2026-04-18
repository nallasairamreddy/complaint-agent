import { useState } from 'react'
import { submitComplaint } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import { Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function Submit() {
  const [form, setForm]       = useState({ customer_id: '', text: '' })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async () => {
    if (!form.customer_id.trim() || !form.text.trim()) {
      setError('Both fields are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const { data } = await submitComplaint(form)
      setResult(data)
      setForm({ customer_id: '', text: '' })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to connect to API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h1 className="font-display text-2xl font-800 text-white mb-1">Submit Complaint</h1>
        <p className="text-slate-500 text-sm mb-8">The PARL agent will analyze and prioritize it instantly.</p>
      </div>

      <div className="bg-ink-900 border border-ink-700 rounded-xl p-6 space-y-5 animate-fade-up opacity-0"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>

        {/* Customer ID */}
        <div>
          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Customer ID</label>
          <input
            type="text"
            value={form.customer_id}
            onChange={e => setForm({ ...form, customer_id: e.target.value })}
            placeholder="e.g. CUST001"
            className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors font-mono"
          />
        </div>

        {/* Complaint Text */}
        <div>
          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Complaint</label>
          <textarea
            rows={5}
            value={form.text}
            onChange={e => setForm({ ...form, text: e.target.value })}
            placeholder="Describe the issue in detail..."
            className="w-full bg-ink-800 border border-ink-600 focus:border-signal-blue rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none font-body"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-signal-red text-sm bg-signal-red/10 border border-signal-red/30 rounded-lg px-4 py-3">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-signal-blue hover:bg-signal-blue/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-display font-600 text-sm transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Analyzing...' : 'Submit & Analyze'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 bg-ink-900 border border-signal-green/30 rounded-xl p-6 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-signal-green" />
            <span className="text-signal-green font-display font-600 text-sm">Analysis Complete</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-ink-800 rounded-lg p-4">
              <p className="text-xs font-mono text-slate-500 mb-1">Priority</p>
              <PriorityBadge priority={result.priority} size="lg" />
            </div>
            <div className="bg-ink-800 rounded-lg p-4">
              <p className="text-xs font-mono text-slate-500 mb-1">Department</p>
              <p className="text-white font-display font-600">{result.department}</p>
            </div>
            <div className="bg-ink-800 rounded-lg p-4">
              <p className="text-xs font-mono text-slate-500 mb-1">Utility Score</p>
              <p className="text-signal-cyan font-mono font-bold text-lg">{result.utility_score}</p>
            </div>
            <div className="bg-ink-800 rounded-lg p-4">
              <p className="text-xs font-mono text-slate-500 mb-1">Sentiment</p>
              <p className={`font-mono font-bold text-lg ${result.sentiment_score < 0 ? 'text-signal-red' : 'text-signal-green'}`}>
                {result.sentiment_score}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
