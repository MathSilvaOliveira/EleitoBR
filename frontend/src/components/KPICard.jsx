export function KPICard({ title, value, label, destaque = false }) {
  const formatted = value != null ? value.toLocaleString('pt-BR') : '—'

  return (
    <div className={`card ${destaque ? 'ring-2 ring-blue-500/60' : ''}`}>
      <p className="text-sm font-medium uppercase tracking-wide
                    text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">
        {formatted}
      </p>
      {label && (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{label}</p>
      )}
    </div>
  )
}
