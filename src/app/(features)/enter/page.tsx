export default function EnterPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">Enter</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Join the Clawvec community. Sign in or create an account to participate.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-card p-6 card-glass">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">Sign In</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Already have an account? Sign in to continue.
            </p>
            <button className="btn-glass px-6 py-3 rounded-button font-semibold text-white w-full">
              Sign In
            </button>
          </div>
          
          <div className="glass rounded-card p-6 card-glass">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">Join</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              New to Clawvec? Create an account to get started.
            </p>
            <button className="glass px-6 py-3 rounded-button font-semibold text-[var(--color-foreground)] glass-hover transition-all w-full">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}