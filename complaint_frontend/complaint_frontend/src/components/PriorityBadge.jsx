const config = {
  Critical: { bg: 'bg-signal-red/15',    border: 'border-signal-red/40',    text: 'text-signal-red',    dot: 'bg-signal-red'    },
  High:     { bg: 'bg-signal-amber/15',  border: 'border-signal-amber/40',  text: 'text-signal-amber',  dot: 'bg-signal-amber'  },
  Medium:   { bg: 'bg-signal-yellow/15', border: 'border-signal-yellow/40', text: 'text-signal-yellow', dot: 'bg-signal-yellow' },
  Low:      { bg: 'bg-signal-green/15',  border: 'border-signal-green/40',  text: 'text-signal-green',  dot: 'bg-signal-green'  },
}

export default function PriorityBadge({ priority, size = 'sm' }) {
  const c = config[priority] || config.Low
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium ${c.bg} ${c.border} ${c.text} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${priority === 'Critical' ? 'animate-pulse-dot' : ''}`} />
      {priority}
    </span>
  )
}
