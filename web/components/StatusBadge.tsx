export default function StatusBadge({ status }: { status: 'verified' | 'provisional' }) {
  const styles = status === 'verified'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles}`}>
      {status}
    </span>
  )
}
