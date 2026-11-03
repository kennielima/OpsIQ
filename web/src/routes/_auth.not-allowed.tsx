import { createFileRoute } from '@tanstack/react-router'
import { NotAllowedPage } from '../features/auth/NotAllowedPage'

export const Route = createFileRoute('/_auth/not-allowed')({
  component: NotAllowedPage,
})
