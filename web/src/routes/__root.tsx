import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { env } from '../env'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Outlet />
      {env.isDev && <TanStackRouterDevtools />}
    </ErrorBoundary>
  ),
})
