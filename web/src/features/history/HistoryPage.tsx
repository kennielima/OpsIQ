import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, AlertTriangle, MessageSquare, RotateCcw, CheckCircle } from 'lucide-react'
import { conversationsApi } from '../../api/conversations'
import { queryKeys } from '../../lib/queryKeys'
import { useNavigate } from '@tanstack/react-router'
import type { ConversationDetail } from '../../types/api'

export function HistoryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: convos = [], isLoading } = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: conversationsApi.list,
  })

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: queryKeys.conversations.detail(selectedId ?? ''),
    queryFn: () => conversationsApi.get(selectedId!),
    enabled: !!selectedId,
  })

  const filtered = convos.filter(c => c.question.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="px-10 py-8 pb-24 max-w-screen w-full">
      <div className="mb-6">
        <h1 className="text-page-title">History</h1>
        <p className="text-body text-ink-2 mt-1">Every question asked in your workspace, with the answer and sources that were given.</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        {/* Left: list */}
        <div className="card overflow-hidden flex flex-col gap-1 p-0">
          <div className="relative p-3 border-b border-line">
            <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9AA3B2]" strokeWidth={1.75} />
            <input className="inp pl-[38px] shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)]" placeholder="Search past questions" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="flex flex-col max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-body text-ink-2 text-center">No questions yet.</p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`text-left border-l-[3px] px-4 py-[14px] w-full transition-colors border-b border-b-line last:border-b-0 rounded-sm ${selectedId === c.id
                  ? 'bg-tint border-l-accent'
                  : 'bg-transparent border-l-transparent hover:bg-[#FAFBFC]'
                  }`}
              >
                <div className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2">{c.question}</div>
                <div className="text-[12px] text-ink-2 mt-[5px] flex gap-[6px] items-center tabular-nums flex-wrap">
                  {c.answerFound
                    ? <span>{c.citationCount} source{c.citationCount !== 1 ? 's' : ''}</span>
                    : <span className="text-warn-ink font-medium">No answer found</span>
                  }
                  <span>·</span>
                  <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(c.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div className="card min-h-[300px]">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <MessageSquare size={32} className="text-ink-2 mb-3" strokeWidth={1.75} />
              <p className="text-[15px] font-semibold text-ink">Select a question to view</p>
              <p className="text-body text-ink-2 mt-1">Choose a past question from the list to see the full answer and sources.</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : detail ? (
            <HistoryDetail detail={detail} onAskAgain={() => navigate({ to: '/ask' })} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HistoryDetail({ detail, onAskAgain }: { detail: ConversationDetail; onAskAgain: () => void }) {
  const parts = detail.answer?.split(/(\[\d+\])/g) ?? []

  return (
    <div className="p-[26px]">
      <h2 className="text-[22px] font-bold tracking-[-0.015em] leading-snug max-w-[70ch]">{detail.question}</h2>
      <div className="text-[13px] text-ink-2 mt-[6px] tabular-nums">
        Asked {new Date(detail.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(detail.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="h-px bg-line-soft my-5" />

      {detail.answerFound ? (
        <>
          <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-ok-ink bg-ok-bg px-[10px] py-[5px] rounded-full mb-4">
            <CheckCircle size={13} strokeWidth={2} />
            Answer grounded in {detail.citationCount} source{detail.citationCount !== 1 ? 's' : ''}
          </span>

          <div className="text-answer leading-[1.65] text-ink max-w-[70ch]">
            {parts.map((part, i) => {
              const m = part.match(/^\[(\d+)\]$/)
              if (m) return (
                <sup key={i} className="text-accent font-semibold text-[11px] leading-none px-px">[{m[1]}]</sup>
              )
              return <span key={i}>{part}</span>
            })}
          </div>

          {detail.citations.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-ink-2 uppercase tracking-[0.08em] mt-7 mb-3">Sources</div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {detail.citations.map(c => (
                  <div key={c.rank} className="card p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-tint text-accent font-semibold text-[13px] grid place-items-center flex-none">
                        {c.rank + 1}
                      </div>
                      <span className="font-semibold text-[13.5px] text-ink leading-snug">{c.documentTitle ?? `Document ${c.rank + 1}`}</span>
                    </div>
                    {c.content && (
                      <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-4">
                        "{c.content.trim().slice(0, 200)}{c.content.trim().length > 200 ? '…' : ''}"
                      </p>
                    )}
                    <p className="text-[12px] text-ink-2">
                      {c.visibility ?? 'Internal'}{c.uploadedAt ? ` · Uploaded ${new Date(c.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-[10px] bg-warn-bg text-warn-ink grid place-items-center flex-none">
            <AlertTriangle size={22} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold">No answer found</h3>
            <p className="text-body text-ink-2 mt-[6px] leading-relaxed">Nothing in the workspace's documents was close enough to cite, so OpsIQ declined to answer rather than guess.</p>
          </div>
        </div>
      )}

      <div className="mt-7 pt-5 border-t border-line-soft flex">
        <button onClick={onAskAgain} className="btn btn-primary">
          <RotateCcw size={16} strokeWidth={1.75} />
          Ask again
        </button>
      </div>
    </div>
  )
}
