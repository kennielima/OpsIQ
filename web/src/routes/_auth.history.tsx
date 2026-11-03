import { createFileRoute } from '@tanstack/react-router'
import { HistoryPage } from '../features/history/HistoryPage'

export const Route = createFileRoute('/_auth/history')({
  component: HistoryPage,
})
