import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center min-h-screen bg-surface">
            <div className="text-center max-w-sm px-6">
              <p className="text-ink font-semibold mb-2">Something went wrong</p>
              <p className="text-muted text-sm mb-4">{this.state.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue hover:underline"
              >
                Reload page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
