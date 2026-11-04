import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Key, Link, Code, Users, Plus, Check, X, Copy, AlertTriangle } from 'lucide-react'
import { settingsApi } from '../../api/settings'
import { queryKeys } from '../../lib/queryKeys'
import { addTeamMemberSchema, addOriginSchema, type AddTeamMemberInput, type AddOriginInput } from '../../lib/schemas'
import type { CreateWidgetKeyResponse } from '../../types/api'

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

function WidgetKeysSection({ onKeyCreated }: { onKeyCreated: (k: CreateWidgetKeyResponse) => void }) {
  const qc = useQueryClient()
  const { data: keys = [] } = useQuery({ queryKey: queryKeys.settings.widgetKeys(), queryFn: settingsApi.listWidgetKeys })
  const { mutate: createKey, isPending } = useMutation({
    mutationFn: settingsApi.createWidgetKey,
    onSuccess: data => { onKeyCreated(data); qc.invalidateQueries({ queryKey: queryKeys.settings.widgetKeys() }) },
  })
  const { mutate: revokeKey } = useMutation({
    mutationFn: settingsApi.revokeWidgetKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.widgetKeys() }),
  })

  return (
    <SectionCard
      icon={<Key size={18} strokeWidth={1.75} />}
      title="Widget keys"
      desc="Publishable keys let your website widget ask questions against your Public documents. A new key is shown in full once — store it when you create it."
      action={<button onClick={() => createKey()} disabled={isPending} className="btn btn-primary btn-sm"><Plus size={16} strokeWidth={1.75} />Create key</button>}
    >
      <div className="overflow-x-auto border border-line rounded bg-card shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)]">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              {['Key', 'Created', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11.5px] font-semibold tracking-[0.05em] uppercase text-ink-2 border-b border-line bg-[#FAFBFC]" style={h === '' ? { textAlign: 'right' } : {}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-body text-ink-2">No keys yet.</td></tr>
            ) : keys.map(k => (
              <tr key={k.id} className="hover:bg-[#FAFBFC] border-b border-line-soft last:border-b-0">
                <td className="px-4 py-3 font-mono text-[13px] text-ink">{k.prefix}…</td>
                <td className="px-4 py-3 text-[13px] text-ink-2 tabular-nums">{new Date(k.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-[6px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full ${k.status === 'Active' ? 'bg-ok-bg text-ok-ink' : 'bg-[#EEF0F3] text-ink-2'}`}>
                    {k.status === 'Active' ? <Check size={12} strokeWidth={2} /> : <X size={12} strokeWidth={2} />}
                    {k.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {k.status === 'Active' && <button onClick={() => revokeKey(k.id)} className="btn btn-ghost btn-sm">Revoke</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

function AllowedOriginsSection() {
  const qc = useQueryClient()
  const { data: origins = [] } = useQuery({ queryKey: queryKeys.settings.origins(), queryFn: settingsApi.listAllowedOrigins })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddOriginInput>({ resolver: zodResolver(addOriginSchema) })
  const { mutate: addOrigin, isPending } = useMutation({
    mutationFn: ({ origin }: AddOriginInput) => settingsApi.addAllowedOrigin(origin),
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: queryKeys.settings.origins() }) },
  })
  const { mutate: removeOrigin } = useMutation({
    mutationFn: settingsApi.removeAllowedOrigin,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.origins() }),
  })

  return (
    <SectionCard icon={<Link size={18} strokeWidth={1.75} />} title="Allowed origins" desc="The widget will only answer when it's embedded on one of these domains.">
      <form onSubmit={handleSubmit(d => addOrigin(d))} className="flex gap-[10px] mb-[6px]">
        <input className="inp font-mono text-[13px] max-w-[420px]" placeholder="https://help.yourcompany.com" {...register('origin')} />
        <button type="submit" disabled={isPending} className="btn btn-secondary btn-sm"><Plus size={16} strokeWidth={1.75} />Add origin</button>
      </form>
      {errors.origin && <p className="text-[12px] text-fail-ink mb-2">{errors.origin.message}</p>}
      <div className="mt-2">
        {origins.length === 0
          ? <p className="text-body text-ink-2">No origins yet.</p>
          : origins.map(o => (
            <div key={o.id} className="flex items-center gap-[10px] py-[11px] border-b border-line-soft last:border-b-0">
              <Link size={16} strokeWidth={1.75} className="text-ink-2 flex-none" />
              <span className="flex-1 font-mono text-[13px] text-ink">{o.origin}</span>
              <button onClick={() => removeOrigin(o.id)} className="btn btn-ghost btn-sm">Remove</button>
            </div>
          ))
        }
      </div>
    </SectionCard>
  )
}

function EmbedSnippetSection() {
  const [copied, setCopied] = useState(false)
  const snippet = `<script\n  src="https://cdn.opsiq.app/widget.js"\n  data-key="pk_acmepay_7Hq2..."\n  async></script>`

  function handleCopy() {
    void navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <SectionCard icon={<Code size={18} strokeWidth={1.75} />} title="Embed snippet" desc="Paste this just before the closing </body> tag on your site. Replace the key if you create a new one.">
      <div className="relative bg-navy rounded-sm px-[18px] py-4 overflow-x-auto">
        <button onClick={handleCopy} className="absolute top-[10px] right-[10px] bg-navy-pill border border-navy-line text-[#C9D6F2] h-8 px-[11px] rounded-[7px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold hover:bg-[#1E2F4B] transition-colors">
          <Copy size={14} strokeWidth={1.75} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <code className="font-mono text-[12.5px] text-[#C9D6F2] whitespace-pre leading-relaxed block">{snippet}</code>
      </div>
    </SectionCard>
  )
}

function TeamSection() {
  const qc = useQueryClient()
  const { data: members = [] } = useQuery({ queryKey: queryKeys.settings.team(), queryFn: settingsApi.listTeamMembers })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddTeamMemberInput>({ resolver: zodResolver(addTeamMemberSchema) })
  const { mutate: addMember, isPending } = useMutation({
    mutationFn: settingsApi.addTeamMember,
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: queryKeys.settings.team() }) },
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
              <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none rotate-0" strokeWidth={1.75} />
            </div>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={isPending} className="btn btn-primary"><Plus size={18} strokeWidth={1.75} />Add team member</button>
          </div>
        </div>
      </form>

      {members.length > 0 && (
        <div className="overflow-x-auto border border-line rounded bg-card shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)] mt-[22px]">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['Member', 'Email', 'Role', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11.5px] font-semibold tracking-[0.05em] uppercase text-ink-2 border-b border-line bg-[#FAFBFC]">{h}</th>
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
                    <span className={`chip ${m.role === 'Admin' ? 'chip-admin' : 'chip-internal'}`}>{m.role}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'Admin' && <button className="btn btn-ghost btn-sm">Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

function KeyCreatedModal({ keyData, onClose }: { keyData: CreateWidgetKeyResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() { void navigator.clipboard.writeText(keyData.rawKey); setCopied(true); setTimeout(() => setCopied(false), 1800) }

  return (
    <div className="fixed inset-0 bg-ink/45 z-modal grid place-items-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded shadow-pop w-full max-w-[520px] p-6">
        <h3 className="text-[18px] font-bold flex items-center gap-[10px]">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-warn-bg text-warn-ink grid place-items-center flex-none"><Key size={20} strokeWidth={2} /></span>
          Key created
        </h3>
        <p className="text-body text-ink-2 leading-relaxed mt-3">Copy this key now and store it somewhere safe. For security, OpsIQ won't show it again.</p>

        <div className="flex items-center gap-[10px] bg-[#FAFBFC] border border-line rounded-sm px-[14px] py-3 mt-4">
          <code className="font-mono text-[13px] text-ink flex-1 break-all">{keyData.rawKey}</code>
          <button onClick={handleCopy} className="btn btn-secondary btn-sm flex-none">
            <Copy size={14} strokeWidth={1.75} />{copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex items-start gap-[9px] bg-warn-bg text-warn-ink rounded-sm px-[13px] py-[11px] text-[12.5px] leading-relaxed mt-[14px]">
          <AlertTriangle size={15} strokeWidth={2} className="flex-none mt-[1px]" />
          Anyone with this key can query your Public documents from an allowed origin. Revoke it if it's ever exposed.
        </div>

        <div className="flex justify-end mt-[22px]">
          <button onClick={onClose} className="btn btn-primary btn-sm">Done</button>
        </div>
      </div>
    </div>
  )
}
