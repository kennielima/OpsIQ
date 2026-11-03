import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const addTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  temporaryPassword: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['Admin', 'Staff']),
})

export const addOriginSchema = z.object({
  origin: z
    .string()
    .url('Enter a valid URL (e.g. https://example.com)')
    .refine((val) => !val.endsWith('/'), 'Remove the trailing slash'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>
export type AddOriginInput = z.infer<typeof addOriginSchema>
