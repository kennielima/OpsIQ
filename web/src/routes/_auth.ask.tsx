import { createFileRoute } from '@tanstack/react-router'
import { AskPage } from '../features/ask/AskPage'

export const Route = createFileRoute('/_auth/ask')({
  component: AskPage,
})
