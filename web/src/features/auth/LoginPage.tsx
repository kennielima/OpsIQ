import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Shield } from 'lucide-react'
import { authApi } from '../../api/auth'
import { HttpError } from '../../api/client'
import { queryKeys } from '../../lib/queryKeys'
import { loginSchema, type LoginInput } from '../../lib/schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      await navigate({ to: '/ask' })
    },
    onError: (err) => {
      const message =
        err instanceof HttpError && (err.status === 401 || err.status === 400)
          ? 'Email or password is incorrect. Try again, or ask your admin to reset it.'
          : 'Something went wrong. Please try again.'
      setError('root', { message })
    },
  })

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1.05fr 1fr' }}>

      {/* Left: brand panel */}
      <div className="bg-navy text-ink-nav flex flex-col" style={{ padding: '56px 60px' }}>
        {/* Logo */}
        <div className="flex items-center gap-[10px] pb-[48px]">
          <div className="w-[30px] h-[30px] rounded-sm bg-accent text-white grid place-items-center font-bold text-base flex-none">
            O
          </div>
          <span className="font-bold text-base text-white tracking-[-0.01em]">OpsIQ</span>
        </div>

        <h1 className="text-[34px] font-bold text-white leading-[1.2] tracking-[-0.02em] max-w-[15ch] mt-auto" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Answers from your own policies, with the source attached.
        </h1>
        <p className="text-base leading-relaxed text-ink-nav mt-5 max-w-[42ch]">
          Ask in plain language. OpsIQ replies only from documents your team has uploaded, and shows you exactly where each line came from.
        </p>

        <div className="mt-auto flex items-center gap-[10px] text-[13px] text-ink-nav-2 pt-9">
          <Shield size={16} strokeWidth={1.75} className="text-[#9FB4FF]" />
          Every workspace's documents are stored and searched separately from each other.
        </div>
      </div>

      {/* Right: form */}
      <div className="grid place-items-center" style={{ padding: '40px' }}>
        <form
          className="w-full max-w-[368px]"
          onSubmit={handleSubmit(d => login(d))}
          noValidate
        >
          <h2 className="text-[22px] font-bold tracking-[-0.01em]">Sign in to OpsIQ</h2>
          <p className="text-body text-ink-2 mt-[6px] mb-[26px]">
            Use the work account your admin set up for you.
          </p>

          {/* Error banner */}
          {errors.root && (
            <div className="flex items-start gap-[9px] bg-fail-bg border border-[#F5C6C6] text-fail-ink rounded-sm px-[13px] py-[11px] text-[13px] leading-relaxed mb-[18px]">
              <AlertCircle size={16} strokeWidth={2} className="flex-none mt-[1px]" />
              <span>{errors.root.message}</span>
            </div>
          )}

          <div className="field mb-4">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="inp"
              {...register('email')}
            />
            {errors.email && <p className="text-[12px] text-fail-ink mt-1">{errors.email.message}</p>}
          </div>

          <div className="field mb-[6px]">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="inp"
              {...register('password')}
            />
            {errors.password && <p className="text-[12px] text-fail-ink mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isPending} className="btn btn-primary w-full mt-[6px]">
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-caption text-ink-2 mt-[22px] text-center">
            Accounts are created by a workspace admin. There's no public sign-up.
          </p>
        </form>
      </div>
    </div>
  )
}
