import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, User, LogOut } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useClearAuth } from '../../hooks/useAuth'
import { queryKeys } from '../../lib/queryKeys'
import type { MeResponse } from '../../types/api'

export function MePage() {
  const { data: user } = useQuery<MeResponse>({ queryKey: queryKeys.me() })
  const clearAuth = useClearAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleLogout() {
    await authApi.logout()
    clearAuth()
    window.location.replace('/login')
  }

  const displayName = user?.displayName ?? user?.name ?? '—'
  const initials = displayName.slice(0, 2).toUpperCase()
  const roleLabel = user?.role === 'TenantAdmin' ? 'Admin' : 'Staff'

  return (
    <section className="px-4 py-6 pb-24 sm:px-10 sm:py-8 max-w-screen w-full">
      <div className="mb-6">
        <h1 className="text-page-title">My profile</h1>
        <p className="text-body text-ink-2 mt-1">Your account details and password.</p>
      </div>

      <div className="flex flex-col gap-5 max-w-[960px]">
        {/* Profile card */}
        <div className="card p-[22px]">
          <h2 className="text-card-heading flex items-center gap-[9px] mb-[18px]">
            <span className="text-ink-2"><User size={18} strokeWidth={1.75} /></span>
            Account
          </h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-[52px] h-[52px] rounded-full bg-[#DCE6FB] text-[#24416F] grid place-items-center font-bold text-[18px] flex-none">
              {initials}
            </div>
            <div>
              <div className="text-[16px] font-bold text-ink">{displayName}</div>
              <div className="text-[13px] text-ink-2 mt-[2px]">{user?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="field">
              <label>Display name</label>
              <input className="inp" value={displayName} readOnly />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="inp" value={user?.email ?? ''} readOnly />
            </div>
            <div className="field">
              <label>Role</label>
              <input className="inp" value={roleLabel} readOnly />
            </div>
            <div className="field">
              <label>Workspace</label>
              <input className="inp" value={user?.tenant?.name ?? user?.tenantName ?? '-'} readOnly />
            </div>
          </div>
        </div>

        {/* Change password */}
        <ChangePasswordCard />

        <div className="card p-[22px] flex items-center justify-between">
          <div className="text-[13px] text-ink-2">End your current session.</div>
          <button onClick={() => setConfirmLogout(true)} className="btn btn-ghost btn-sm text-[#B91C1C] hover:text-[#991B1B] inline-flex items-center gap-[6px]">
            <LogOut size={16} strokeWidth={1.75} />Sign out
          </button>
        </div>

        {confirmLogout && (
          <div className="fixed inset-0 bg-ink/45 z-[9999] grid place-items-center p-6" onClick={e => { if (e.target === e.currentTarget) setConfirmLogout(false) }}>
            <div className="bg-card rounded shadow-pop w-full max-w-[380px] p-6">
              <h3 className="text-[17px] font-bold text-ink">Sign out?</h3>
              <p className="text-body text-ink-2 mt-2">Are you sure you want to sign out?</p>
              <div className="flex justify-end gap-[10px] mt-6">
                <button onClick={() => setConfirmLogout(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={handleLogout} className="btn btn-sm bg-[#B91C1C] text-white hover:bg-[#991B1B] border-transparent">Sign out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ChangePasswordCard() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ currentPassword: string; newPassword: string }>()

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => { setSuccess(true); setErrorMsg(null); reset(); setTimeout(() => setSuccess(false), 3000) },
    onError: () => setErrorMsg('Current password is incorrect or the request failed.'),
  })

  return (
    <div className="card p-[22px]">
      <h2 className="text-card-heading flex items-center gap-[9px] mb-[18px]">
        <span className="text-ink-2"><Lock size={18} strokeWidth={1.75} /></span>
        Change password
      </h2>
      <form onSubmit={handleSubmit(d => mutate(d))} className="grid gap-[14px] max-w-[420px]">
        {errorMsg && <p className="text-[12px] text-fail-ink">{errorMsg}</p>}
        {success && <p className="text-[12px] text-ok-ink">Password updated successfully.</p>}
        <div className="field">
          <label>Current password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} className="inp pr-11" {...register('currentPassword', { required: true })} />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink">
              {showCurrent ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
            </button>
          </div>
          {errors.currentPassword && <p className="text-[12px] text-fail-ink">Required</p>}
        </div>
        <div className="field">
          <label>New password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} className="inp pr-11" {...register('newPassword', { required: true, minLength: 8 })} />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink">
              {showNew ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
            </button>
          </div>
          {errors.newPassword && <p className="text-[12px] text-fail-ink">Min 8 characters</p>}
        </div>
        <div>
          <button type="submit" disabled={isPending} className="btn btn-primary">{isPending ? 'Saving…' : 'Update password'}</button>
        </div>
      </form>
    </div>
  )
}
