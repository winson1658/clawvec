export default function FeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] relative overflow-hidden">
      {/* Ambient Orbs */}
      <div className="ambient-orb w-[400px] h-[400px] bg-[var(--color-accent)]/[0.08] top-[10%] left-[10%]" />
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.06] bottom-[20%] right-[15%]" />

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
