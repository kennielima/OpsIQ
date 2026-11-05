import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Key, Link, Code, Users, Plus, Check, X, Copy, AlertTriangle } from 'lucide-react'
import { settingsApi } from '../../api/settings'
import { queryKeys } from '../../lib/queryKeys'
import { addTeamMemberSchema, addOriginSchema, type AddTeamMemberInput, type AddOriginInput } from '../../lib/schemas'
import type { CreateWidgetKeyResponse, TeamMember } from '../../types/api'

export function SettingsPage() {
  const [newKey, setNewKey] = useState<CreateWidgetKeyResponse | null>(null)

  return (
    <section className="px-10 py-8 pb-24 max-w-screen w-full">
      <div className="mb-6">
        <h1 className="text-page-title">Settings</h1>
        <p className="text-body text-ink-2 mt-1">Widget keys, allowed origins and team management. Visible to admins only.

        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-[960px]">
        <WidgetKeysSection onKeyCreated={setNewKey} />
        <AllowedOriginsSection />
        <EmbedSnippetSection />
        <TeamSection />
      </div>

      {newKey && <KeyCreatedModal keyData={newKey} onClose={() => setNewKey(null)} />}
    </section>
  )
}

function SectionCard({ icon, title, desc, action, children }: {
  icon: React.ReactNode
  title: string
  desc: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card p-[22px]">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-card-heading flex items-center gap-[9px]">
            <span className="text-ink-2">{icon}</span>
            {title}
          </h2>
          <p className="text-[13px] text-ink-2 mt-[3px] max-w-[66ch] leading-snug">{desc}</p>
        </div>
        {action}
      </div>
      <div className="mt-[18px]">{children}</div>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel = 'Confirm', isPending, onConfirm, onClose }: {
  title: string
  message: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-ink/45 z-modal grid place-items-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded shadow-pop w-full max-w-[400px] p-6">
        <h3 className="text-[17px] font-bold text-ink">{title}</h3>
        <p className="text-body text-ink-2 mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-[10px] mt-6">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="btn btn-sm bg-[#B91C1C] text-white hover:bg-[#991B1B] border-transparent">
            {isPending ? 'Removing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function WidgetKeysSection({ onKeyCreated }: { onKeyCreated: (k: CreateWidgetKeyResponse) => void }) {
  const qc = useQueryClient()
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [showRevoked, setShowRevoked] = useState(false)
  const { data: keys = [] } = useQuery({ queryKey: queryKeys.settings.widgetKeys(), queryFn: settingsApi.listWidgetKeys })

  const activeKeys = keys.filter(k => k.status === 'Active')
  const revokedKeys = keys.filter(k => k.status === 'Revoked').slice(0, 10)
  const visibleKeys = showRevoked ? [...activeKeys, ...revokedKeys] : activeKeys
  const { mutate: createKey, isPending } = useMutation({
    mutationFn: settingsApi.createWidgetKey,
    onSuccess: data => { onKeyCreated(data); qc.invalidateQueries({ queryKey: queryKeys.settings.widgetKeys() }) },
  })
  const { mutate: revokeKey, isPending: isRevoking } = useMutation({
    mutationFn: settingsApi.revokeWidgetKey,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.settings.widgetKeys() }); setRevokingId(null) },
  })

  return (
    <SectionCard
      icon={<Key size={18} strokeWidth={1.75} />}
      title="Widget keys"
      desc="Publishable keys let your website widget ask questions against your Public documents. A new key is shown in full once, store it when you create it."
      action={<button onClick={() => createKey()} disabled={isPending} className="btn btn-primary btn-sm"><Plus size={16} strokeWidth={1.75} />Create key</button>}
    >
      {keys.some(k => k.status === 'Revoked') && (
        <div className="inline-flex items-center bg-[#F0F2F5] rounded-full p-[3px] mb-3">
          {(['Active', 'All'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setShowRevoked(opt === 'All')}
              className={`h-[28px] px-4 rounded-full text-[12px] font-semibold transition-colors border-none cursor-pointer ${(opt === 'Active') === !showRevoked ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-ink-2 hover:text-ink'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto border border-line rounded bg-card shadow-[0_1px_4px_rgba(16,24,40,.15),_0_1px_2px_rgba(16,24,40,.09)]">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              {['Key', 'Created', 'Last used', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11.5px] font-semibold tracking-[0.05em] uppercase text-ink-2 border-b border-line bg-[#FAFBFC]" style={h === '' ? { textAlign: 'right' } : {}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleKeys.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-body text-ink-2">No keys yet.</td></tr>
            ) : visibleKeys.map(k => (
              <tr key={k.id} className="hover:bg-[#FAFBFC] border-b border-line-soft last:border-b-0">
                <td className="px-4 py-3 font-mono text-[13px] text-ink">{k.prefix}…</td>
                <td className="px-4 py-3 text-[13px] text-ink-2 tabular-nums">{new Date(k.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-[13px] text-ink-2 tabular-nums">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-[6px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full ${k.status === 'Active' ? 'bg-ok-bg text-ok-ink' : 'bg-[#EEF0F3] text-ink-2'}`}>
                    {k.status === 'Active' ? <Check size={12} strokeWidth={2} /> : <X size={12} strokeWidth={2} />}
                    {k.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {k.status === 'Active' && <button onClick={() => setRevokingId(k.id)} className="btn btn-ghost btn-sm text-[#B91C1C] hover:text-[#991B1B]">Revoke</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {revokingId && (
        <ConfirmModal
          title="Revoke key"
          message="This key will stop working immediately. Any widget using it will lose access. This cannot be undone."
          confirmLabel="Revoke key"
          isPending={isRevoking}
          onConfirm={() => revokeKey(revokingId)}
          onClose={() => setRevokingId(null)}
        />
      )}
    </SectionCard>
  )
}

function AllowedOriginsSection() {
  const qc = useQueryClient()
  const [removingOrigin, setRemovingOrigin] = useState<string | null>(null)
  const { data: origins = [] } = useQuery({ queryKey: queryKeys.settings.origins(), queryFn: settingsApi.listAllowedOrigins })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddOriginInput>({ resolver: zodResolver(addOriginSchema) })
  const { mutate: setOrigins, isPending } = useMutation({
    mutationFn: settingsApi.setAllowedOrigins,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.settings.origins() }); setRemovingOrigin(null) },
  })

  function add({ origin }: AddOriginInput) {
    if (origins.includes(origin)) return
    setOrigins([...origins, origin])
    reset()
  }

  return (
    <SectionCard icon={<Link size={18} strokeWidth={1.75} />} title="Allowed origins" desc="The widget only runs on these domains. Requests from other origins are rejected.">
      <form onSubmit={handleSubmit(add)} className="flex gap-[10px] mb-[6px]">
        <input className="inp font-mono text-[13px] max-w-[420px]" placeholder="https://help.yourcompany.com" {...register('origin')} />
        <button type="submit" disabled={isPending} className="btn btn-secondary btn-sm"><Plus size={16} strokeWidth={1.75} />Add origin</button>
      </form>
      {errors.origin && <p className="text-[12px] text-fail-ink mb-2">{errors.origin.message}</p>}
      <div className="mt-2 border border-line rounded-sm shadow-[0_1px_4px_rgba(16,24,40,.15),_0_1px_2px_rgba(16,24,40,.09)]">
        {origins.length === 0
          ? <p className="text-body text-ink-2 px-4 py-3">No origins yet.</p>
          : origins.map(o => (
            <div key={o} className="flex items-center gap-[10px] px-4 py-[11px] border-b border-line-soft last:border-b-0">
              <Link size={16} strokeWidth={1.75} className="text-ink-2 flex-none" />
              <span className="flex-1 font-mono text-[13px] text-ink">{o}</span>
              <button onClick={() => setRemovingOrigin(o)} disabled={isPending} className="btn btn-ghost btn-sm text-[#B91C1C] hover:text-[#991B1B]">Remove</button>
            </div>
          ))
        }
      </div>

      {removingOrigin && (
        <ConfirmModal
          title="Remove origin"
          message={`Remove "${removingOrigin}"? The widget will stop working on this domain immediately.`}
          confirmLabel="Remove"
          isPending={isPending}
          onConfirm={() => setOrigins(origins.filter(o => o !== removingOrigin))}
          onClose={() => setRemovingOrigin(null)}
        />
      )}
    </SectionCard>
  )
}

function EmbedSnippetSection() {
  const [copied, setCopied] = useState(false)
  const snippet = `<script\n  src="https://cdn.opsiq.app/widget.js"\n  data-key="pk_acmepay_7Hq2..."\n async></script>`

  function handleCopy() {
    void navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <SectionCard icon={<Code size={18} strokeWidth={1.75} />} title="Embed snippet" desc="Paste this just before the closing </body> tag on your site. Replace the key if you create a new one.">
      <div className="bg-navy rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-[18px] py-[10px] border-b border-navy-line">
          <span className="text-[11.5px] font-semibold text-ink-nav-2 uppercase tracking-[0.06em]">HTML</span>
          <button onClick={handleCopy} className="bg-navy-pill border border-navy-line text-[#C9D6F2] h-7 px-[10px] rounded-[6px] inline-flex items-center gap-[6px] text-[12px] font-semibold hover:bg-[#1E2F4B] transition-colors">
            <Copy size={13} strokeWidth={1.75} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto px-[18px] py-4">
          <code className="font-mono text-[12.5px] leading-relaxed block whitespace-pre">
            <span className="text-indigo-400">{'<script'}</span>{'\n'}
            <span>{'  '}</span><span className="text-green-300">src</span><span className="text-[#ABB2BF]">{'='}</span><span className="text-yellow-500">{'"https://cdn.opsiq.app/widget.js"'}</span>{'\n'}
            <span>{'  '}</span><span className="text-green-300">data-key</span><span className="text-[#ABB2BF]">{'='}</span><span className="text-yellow-500">{'"pk_acmepay_7Hq2..."'}</span>{'\n'}
            <span>{'  '}</span><span className="text-green-300">async</span><span className="text-indigo-400">{'></script>'}</span>
          </code>
        </div>
      </div>
    </SectionCard>
  )
}

function TeamSection() {
  const qc = useQueryClient()
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null)
  const { data: members = [] } = useQuery({ queryKey: queryKeys.settings.team(), queryFn: settingsApi.listTeamMembers })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddTeamMemberInput>({ resolver: zodResolver(addTeamMemberSchema) })
  const { mutate: addMember, isPending } = useMutation({
    mutationFn: settingsApi.addTeamMember,
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: queryKeys.settings.team() }) },
  })
  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: settingsApi.removeTeamMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.settings.team() }); setRemovingMember(null) },
  })
  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'Admin' | 'Staff' }) => settingsApi.updateMemberRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.settings.team() }); setEditingMember(null) },
  })

  return (
    <SectionCard icon={<Users size={18} strokeWidth={1.75} />} title="Team" desc="Add teammates to this workspace. Admins manage settings; staff can ask questions and manage documents.">
      <form onSubmit={handleSubmit(d => addMember(d))}>
        <div className="grid grid-cols-2 gap-[14px] max-w-[620px]">
          <div className="field">
            <label htmlFor="tm-name">Full name</label>
            <input id="tm-name" className="inp" placeholder="Jordan Ellis" {...register('name')} />
            {errors.name && <p className="text-[12px] text-fail-ink">{errors.name.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="tm-email">Work email</label>
            <input id="tm-email" type="email" className="inp" placeholder="jordan@acmepay.com" {...register('email')} />
            {errors.email && <p className="text-[12px] text-fail-ink">{errors.email.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="tm-pass">Temporary password</label>
            <input id="tm-pass" type="password" className="inp" placeholder="They'll reset it on first sign-in" {...register('temporaryPassword')} />
            {errors.temporaryPassword && <p className="text-[12px] text-fail-ink">{errors.temporaryPassword.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="tm-role">Role</label>
            <div className="relative">
              <select id="tm-role" className="inp appearance-none pr-9 cursor-pointer" {...register('role')}>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={isPending} className="btn btn-primary"><Plus size={18} strokeWidth={1.75} />Add team member</button>
          </div>
        </div>
      </form>

      {members.length > 0 && (
        <div className="overflow-x-auto border border-line rounded bg-card shadow-[0_1px_4px_rgba(16,24,40,.15),_0_1px_2px_rgba(16,24,40,.09)] mt-[22px]">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['Member', 'Email', 'Role', '', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[11.5px] font-semibold tracking-[0.05em] uppercase text-ink-2 border-b border-line bg-[#FAFBFC]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="hover:bg-[#FAFBFC] border-b border-line-soft last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-[30px] h-[30px] rounded-full bg-[#DCE6FB] text-[#24416F] grid place-items-center font-bold text-[11px] flex-none">
                        {(m.name ?? m.email).slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-[13.5px] text-ink">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-2">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center h-[26px] px-[10px] rounded-full border text-[12px] font-semibold ${m.role === 'Admin' ? 'bg-tint text-accent border-tint-line' : 'bg-[#EEF0F3] text-ink-2 border-line'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingMember(m)} className="text-[13px] font-semibold text-accent hover:text-accent/80 bg-transparent border-none p-0 cursor-pointer">Edit</button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setRemovingMember(m)} className="btn btn-ghost btn-sm text-[#B91C1C] hover:text-[#991B1B]">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingMember && (
        <EditRoleModal
          member={editingMember}
          isPending={isUpdatingRole}
          onConfirm={role => updateRole({ id: editingMember.id, role })}
          onClose={() => setEditingMember(null)}
        />
      )}

      {removingMember && (
        <ConfirmModal
          title="Remove team member"
          message={`Remove ${removingMember.name ?? removingMember.email} from this workspace? They will lose access immediately.`}
          confirmLabel="Remove member"
          isPending={isRemoving}
          onConfirm={() => removeMember(removingMember.id)}
          onClose={() => setRemovingMember(null)}
        />
      )}
    </SectionCard>
  )
}

function EditRoleModal({ member, isPending, onConfirm, onClose }: {
  member: TeamMember
  isPending: boolean
  onConfirm: (role: 'Admin' | 'Staff') => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<'Admin' | 'Staff'>(member.role)

  return (
    <div className="fixed inset-0 bg-ink/45 z-modal grid place-items-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded shadow-pop w-full max-w-[400px] p-6">
        <h3 className="text-[17px] font-bold">Change role</h3>
        <p className="text-body text-ink-2 mt-1">Update role for <span className="font-semibold text-ink">{member.name ?? member.email}</span>.</p>

        <div className="flex flex-col gap-[10px] mt-5">
          {(['Admin', 'Staff'] as const).map(r => (
            <label key={r} className={`flex items-center gap-[12px] px-[14px] py-[12px] rounded border cursor-pointer transition-colors ${selected === r ? 'border-accent bg-tint' : 'border-line bg-card hover:bg-[#FAFBFC]'}`}>
              <input type="radio" name="role" value={r} checked={selected === r} onChange={() => setSelected(r)} className="accent-accent" />
              <div>
                <div className="text-[13.5px] font-semibold text-ink">{r}</div>
                <div className="text-[12px] text-ink-2">{r === 'Admin' ? 'Can manage settings, keys, and team members' : 'Can ask questions and manage documents'}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-[10px] mt-[22px]">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={() => onConfirm(selected)} disabled={isPending || selected === member.role} className="btn btn-primary btn-sm">
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function KeyCreatedModal({ keyData, onClose }: { keyData: CreateWidgetKeyResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() { void navigator.clipboard.writeText(keyData.rawKey); setCopied(true); setTimeout(() => setCopied(false), 1800) }

  return (
    <div className="fixed inset-0 bg-ink/45 z-modal grid place-items-center p-6">
      <div className="bg-[#F0F2FA] rounded-2xl shadow-pop w-full max-w-[540px] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-[#D6F5E3] text-[#1A7A47] grid place-items-center flex-none">
              <Key size={24} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-ink">Key Created Successfully</h3>
              <p className="text-[13px] text-ink-2 mt-[2px]">Your new widget API key is ready to use.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-2 hover:text-ink bg-transparent border-none p-1 mt-[2px]">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Warning banner */}
        <div className="mx-6 mb-5 bg-[#E4E8F7] rounded-xl px-4 py-4 flex items-start gap-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-accent flex-none mt-[1px]" />
          <div>
            <p className="text-[14px] font-bold text-ink">Save your secret token</p>
            <p className="text-[13px] text-ink-2 mt-[2px] leading-snug">Make sure to copy your API key now. You will not be able to see it again once you close this window.</p>
          </div>
        </div>

        {/* Key box */}
        <div className="mx-6 mb-6">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-2 mb-2">Secret Widget API Key</p>
          <div className="bg-[#0F1117] rounded-xl px-4 py-4 flex items-center gap-3">
            <code className="font-mono text-[13px] text-[#4ADE80] flex-1 break-all leading-relaxed">{keyData.rawKey}</code>
            <button onClick={handleCopy} className="flex-none flex items-center gap-[6px] bg-[#1E2535] hover:bg-[#2A3347] text-[#C9D6F2] text-[13px] font-semibold px-3 py-[7px] rounded-lg border border-[#2E3D57] transition-colors">
              <Copy size={14} strokeWidth={1.75} />{copied ? 'Copied!' : 'Copy key'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#D8DCF0] px-6 py-4 flex justify-end">
          <button onClick={onClose} className="btn btn-primary px-8">Done</button>
        </div>
      </div>
    </div>
  )
}
