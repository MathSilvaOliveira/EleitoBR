/**
 * Componente KPICard — exibe um indicador-chave de desempenho.
 *
 * Componente puramente visual (presentational): recebe dados via props
 * e não possui lógica de negócio ou estado próprio.
 *
 * @param {{ title: string, value: number|null, label: string }} props
 */
export function KPICard({ title, value, label }) {
  const formatted = value != null
    ? value.toLocaleString('pt-BR')
    : '—'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {formatted}
      </p>
      {label && (
        <p className="mt-1 text-sm" style={{ color: '#9ca3af' }}>{label}</p>
      )}
    </div>
  )
}
