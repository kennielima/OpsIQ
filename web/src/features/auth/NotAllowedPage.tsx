import { Link } from '@tanstack/react-router'

export function NotAllowedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="text-center max-w-sm px-6">
        <p className="text-ink font-semibold text-lg mb-2">Access restricted</p>
        <p className="text-muted text-sm mb-6">You don't have permission to view this page.</p>
        <Link to="/ask" className="text-sm text-blue hover:underline">
          Back to Ask
        </Link>
      </div>
    </div>
  )
}
