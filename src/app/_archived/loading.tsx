export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-card p-8 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    </div>
  )
}