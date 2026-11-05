import { createFileRoute } from '@tanstack/react-router'
import { MePage } from '../features/me/MePage'

export const Route = createFileRoute('/_auth/me')({
  component: MePage,
})
