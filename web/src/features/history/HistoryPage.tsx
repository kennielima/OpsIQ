import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, CheckCircle, AlertTriangle, FileText, MessageSquare } from 'lucide-react'
import { conversationsApi } from '../../api/conversations'
import { queryKeys } from '../../lib/queryKeys'
import type { ConversationDetail } from '../../types/api'

export function HistoryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
        <p className="text-body text-ink-2 mt-1">Every question asked in this workspace, with the answer and sources that were shown.</p>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start' }}>
        {/* Left: list */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-[14px] border-b border-line">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]" strokeWidth={1.75} />
              <input className="inp pl-[38px]" placeholder="Search questions" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col max-h-[560px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-10 text-body text-ink-2">No questions yet.</p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`text-left border-none border-l-[3px] px-4 py-[14px] border-b border-b-line-soft w-full block transition-colors ${
                  selectedId === c.id
                    ? 'bg-tint border-l-accent'
                    : 'bg-transparent border-l-transparent hover:bg-[#FAFBFC]'
                }`}
              >
                <div className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2">{c.question}</div>
                <div className="text-[12px] text-ink-2 mt-[6px] flex gap-2 items-center tabular-nums">
                  {c.answerFound
                    ? <><span>{c.citationCount} source{c.citationCount !== 1 ? 's' : ''}</span>·</>
                    : <span className="text-warn-ink font-semibold">No answer found</span>
                  }
                  <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, {new Date(c.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div className="card">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <MessageSquare size={32} className="text-ink-2 mb-3" strokeWidth={1.75} />
              <p className="text-body font-semibold text-ink">Select a question to view</p>
              <p className="text-body text-ink-2 mt-1">Choose a past question from the list to see the full answer and sources.</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : detail ? (
            <HistoryDetail detail={detail} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HistoryDetail({ detail }: { detail: ConversationDetail }) {
  return (
    <div className="p-[26px]">
      <h2 className="text-[20px] font-bold tracking-[-0.01em] max-w-[60ch]">{detail.question}</h2>
      <div className="text-[13px] text-ink-2 mt-[6px]">
        Asked {new Date(detail.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(detail.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="h-px bg-line-soft my-5" />

      {detail.answerFound ? (
        <>
          <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-ok-ink bg-ok-bg px-[10px] py-[5px] rounded-full mb-4">
            <CheckCircle size={13} strokeWidth={2} />
            Answer grounded in {detail.citationCount} source{detail.citationCount !== 1 ? 's' : ''}
          </span>
          <div className="text-answer leading-[1.65] max-w-[64ch] text-ink"
            dangerouslySetInnerHTML={{ __html: detail.answer.replace(/\[(\d+)\]/g, '<sup class="text-accent font-semibold text-[11px] cursor-default">[$1]</sup>') }}
          />

          {detail.citations.length > 0 && (
            <>
              <div className="text-label text-ink-2 uppercase tracking-[0.06em] mt-[22px] mb-[10px]">Sources</div>
              <div className="flex flex-col gap-3 max-w-[420px]">
                {detail.citations.map(c => (
                  <div key={c.rank} className="card flex gap-3 p-[14px]">
                    <div className="w-[22px] h-[22px] rounded-xs bg-tint text-accent font-bold text-[12px] grid place-items-center flex-none mt-[1px]">
                      {c.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-[7px] font-semibold text-[13.5px] text-ink">
                        <FileText size={15} strokeWidth={1.75} className="text-ink-2 flex-none" />
                        <span className="truncate">{c.documentTitle ?? `Document ${c.rank + 1}`}</span>
                      </div>
                      {c.uploadedAt && <div className="text-[12px] text-ink-2 mt-[6px]">{c.visibility} · {new Date(c.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </div>
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

      <div className="mt-[22px]">
        <button className="btn btn-secondary btn-sm">
          <MessageSquare size={16} strokeWidth={1.75} />
          Ask again
        </button>
      </div>
    </div>
  )
}
