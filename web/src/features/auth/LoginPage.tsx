import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { HttpError } from '../../api/client'
import { queryKeys } from '../../lib/queryKeys'
import { loginSchema, type LoginInput } from '../../lib/schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      await navigate({ to: '/ask' })
    },
    onError: (err) => {
      const message =
        err instanceof HttpError && err.status === 401
          ? 'Email or password is incorrect. Try again, or ask your admin to reset it.'
          : 'Something went wrong. Please try again.'
      setError('root', { message })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex w-1/2 bg-navy flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue flex items-center justify-center text-white font-bold text-lg">
            O
          </div>
          <span className="text-white text-xl font-semibold">OpsIQ</span>
        </div>
        <h1 className="text-white text-3xl font-bold leading-snug mb-4">
          Answers from your own policies, with the source attached.
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Ask questions in plain language and get answers drawn from your uploaded documents — every claim cited.
        </p>
        <p className="mt-10 text-gray-600 text-xs">
          Each workspace's documents are kept separate and are never shared across tenants.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <h2 className="text-ink text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-muted text-sm mb-8">Enter your work email and password.</p>

          <form onSubmit={handleSubmit((data) => login(data))} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full h-11 px-3 rounded-lg border border-border text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-status-failed-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full h-11 px-3 rounded-lg border border-border text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-status-failed-text">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p role="alert" className="text-sm text-status-failed-text bg-status-failed-bg px-3 py-2 rounded-lg">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
