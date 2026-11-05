import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import { queryKeys } from '../../lib/queryKeys'
import { Link } from '@tanstack/react-router'
import {
  Send, CheckCircle, Copy, ThumbsUp, ThumbsDown,
  AlertTriangle, RotateCcw, FileSearch, Upload, FileText, Timer, Clock,
} from 'lucide-react'
import { queryApi } from '../../api/query'
import { HttpError } from '../../api/client'
import type { QueryResponse, Citation } from '../../types/api'

const MAX_CHARS = 500

export function AskPage() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'answer' | 'noanswer' | 'ratelimit'>('idle')
  const [activeCite, setActiveCite] = useState<number | null>(null)
  const srcRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const { mutate: ask } = useMutation({
    mutationFn: queryApi.ask,
    onSuccess: data => {
      setResult(data)
      setState(data.citations.length > 0 ? 'answer' : 'noanswer')
      setActiveCite(null)
    },
    onError: err => {
      setState(err instanceof HttpError && err.status === 429 ? 'ratelimit' : 'idle')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setState('loading')
    setResult(null)
    ask({ question, conversationId: result?.conversationId })
  }

  function handleCite(rank: number) {
    setActiveCite(rank)
    srcRefs.current[rank]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => setActiveCite(null), 1800)
  }

  return (
    <section className="px-4 py-6 pb-24 sm:px-10 sm:py-8 max-w-screen w-full">
      <div className="mb-6">
        <h1 className="text-page-title">Ask</h1>
        <p className="text-body text-ink-2 mt-1">
          Ask a question and get an answer drawn only from your workspace's documents, with sources attached.
        </p>
      </div>

      {/* Input card */}
      <form onSubmit={handleSubmit} className="card p-[18px]">
        <div className="field">
          <label htmlFor="q" className="sr-only">Your question</label>
          <textarea
            id="q"
            className="inp"
            placeholder="Ask anything about your policies, runbooks, or procedures…"
            value={question}
            maxLength={MAX_CHARS}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12.5px] text-ink-2">
            {state === 'loading' && 'Searching all workspace documents'}
            {state === 'answer' && `Answer grounded in ${result?.citations.length ?? 0} source${result?.citations.length !== 1 ? 's' : ''} · ask a follow-up below`}
          </span>
          <span className="text-ink-2 text-[12.5px] tabular-nums"><b>{question.length}</b> of {MAX_CHARS} characters</span>
        </div>
        <div className="flex justify-end mt-3">
          <button type="submit" disabled={state === 'loading' || !question.trim()} className="btn btn-primary">
            <Send size={17} strokeWidth={1.75} />
            Ask question
          </button>
        </div>
      </form>

      {/* Rate limit */}
      {state === 'ratelimit' && (
        <div className="card mt-5 p-[26px]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-warn-bg text-warn-ink grid place-items-center flex-none shrink-0">
              <Timer size={22} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-ink">Too many requests. Try again in a minute.</h3>
              <p className="text-body text-ink-2 mt-[6px] leading-relaxed">
                You've sent several questions in a short time. Nothing was lost, your documents and history are unaffected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div className="grid gap-5 mt-5 grid-cols-1 sm:grid-cols-[1fr_340px]">
          <div className="card p-[22px]">
            <span className="inline-flex items-center gap-2 text-ink-2 text-[12.5px]">
              <Clock size={17} className="text-accent" strokeWidth={1.75} />
              Searching documents and writing a grounded answer…
            </span>
            <div className="flex flex-col gap-3 mt-[18px]">
              {[94, 99, 86, 72, 90, 64].map((w, i) => (
                <div key={i} className="h-[14px] rounded-xs bg-[#EDEFF2] animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-label text-ink-2 uppercase tracking-[0.06em] mb-[10px]">Sources</div>
            <div className="flex flex-col gap-3">
              {[0, 1].map(i => (
                <div key={i} className="card flex gap-3 p-[14px]">
                  <div className="w-[22px] h-[22px] rounded-xs bg-[#EEF0F3] flex-none animate-pulse" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-[13px] rounded-xs bg-[#EDEFF2] animate-pulse" style={{ width: '70%' }} />
                    <div className="h-[11px] rounded-xs bg-[#EDEFF2] animate-pulse" style={{ width: '90%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Answer */}
      {state === 'answer' && result && (
        <div className="grid gap-5 mt-5 items-start grid-cols-1 sm:grid-cols-[1fr_340px]">
          <AnswerCard result={result} onCite={handleCite} />
          <SourcesPanel citations={result.citations} activeCite={activeCite} srcRefs={srcRefs} />
        </div>
      )}

      {/* No answer */}
      {state === 'noanswer' && (
        <div className="mt-5">
          <div className="card p-[26px]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-warn-bg text-warn-ink grid place-items-center flex-none shrink-0">
                <AlertTriangle size={22} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold text-ink">I couldn't find this in your documents</h3>
                <p className="text-body text-ink-2 mt-[6px] leading-relaxed">
                  Nothing in your documents was close enough to cite, so OpsIQ won't guess. A confident but unsourced answer is exactly what this tool is built to avoid.
                </p>

                <ul className="list-none p-0 m-0 mt-5 flex flex-col gap-[10px]">
                  {[
                    { icon: <RotateCcw size={15} strokeWidth={1.75} />, text: 'Rephrase using the wording your documents use — for example "representment window" instead of "dispute deadline".' },
                    { icon: <FileSearch size={15} strokeWidth={1.75} />, text: 'Check the relevant document has finished processing on the Documents page.' },
                    { icon: <Upload size={15} strokeWidth={1.75} />, text: "If it isn't there yet, ask an admin to upload it." },
                  ].map(({ icon, text }, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px] text-ink items-start">
                      <span className="text-ink-2 mt-[2px] flex-none">{icon}</span>
                      {text}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-[10px] mt-6 flex-wrap">
                  <Link to="/documents" className="btn btn-primary no-underline">
                    <FileText size={18} strokeWidth={1.75} />
                    View documents
                  </Link>
                  <button className="btn btn-secondary" onClick={() => document.getElementById('q')?.focus()}>
                    Rephrase question
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function AnswerCard({ result, onCite }: { result: QueryResponse; onCite: (rank: number) => void }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (result.answer) void navigator.clipboard.writeText(result.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const parts = result.answer?.split(/(\[\d+\])/g) ?? []

  return (
    <div className="card p-[22px]">
      <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-ok-ink bg-ok-bg px-[10px] py-[5px] rounded-full">
        <CheckCircle size={13} strokeWidth={2} />
        Answer grounded in {result.citations.length} source{result.citations.length !== 1 ? 's' : ''}
      </span>

      <div className="mt-4 max-w-[64ch]">
        {parts.map((part, i) => {
          const m = part.match(/^\[(\d+)\]$/)
          if (m) {
            const rank = parseInt(m[1], 10)
            return (
              <button
                key={i}
                onClick={() => onCite(rank)}
                className="text-accent font-semibold text-[11px] align-super leading-none px-px rounded-xs hover:bg-tint transition-colors cursor-pointer border-none bg-transparent"
              >
                [{rank}]
              </button>
            )
          }
          return <span key={i} className="text-answer leading-[1.65]">{part}</span>
        })}
      </div>

      <div className="flex items-center gap-[6px] mt-[18px] pt-4 border-t border-line-soft">
        <button onClick={handleCopy} className="btn btn-ghost btn-sm">
          <Copy size={15} strokeWidth={1.75} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <div className="flex-1" />
        <button className="btn btn-ghost btn-sm"><ThumbsUp size={15} strokeWidth={1.75} />Helpful</button>
        <button className="btn btn-ghost btn-sm"><ThumbsDown size={15} strokeWidth={1.75} />Not helpful</button>
      </div>
    </div>
  )
}

function SourcesPanel({ citations, activeCite, srcRefs }: {
  citations: Citation[]
  activeCite: number | null
  srcRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>
}) {
  const { data: docs = [] } = useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: documentsApi.list,
    staleTime: 5 * 60 * 1000,
  })

  function docName(documentId: string) {
    return docs.find(d => d.id === documentId)?.fileName ?? 'Unknown document'
  }

  function snippet(content: string) {
    const trimmed = content.trim()
    return trimmed.length > 180 ? trimmed.slice(0, 180).trimEnd() + '…' : trimmed
  }

  return (
    <div>
      <div className="text-label text-ink-2 uppercase tracking-[0.06em] mb-[10px]">Sources</div>
      <div className="flex flex-col gap-3">
        {citations.map(c => (
          <div
            key={c.rank}
            ref={el => { srcRefs.current[c.rank] = el }}
            className={`card p-5 transition-all duration-150 ${activeCite === c.rank ? 'border-accent shadow-[0_0_0_3px_#EAF0FF]' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Number badge */}
              <div className="w-8 h-8 rounded-full bg-tint text-accent font-semibold text-[13px] grid place-items-center flex-none">
                {c.rank + 1}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13.5px] text-ink leading-snug">
                  {c.documentTitle ?? docName(c.documentId)}
                </p>
                <p className="text-[13px] leading-relaxed text-ink-2 mt-[7px] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                  "{c.snippet ?? snippet(c.content)}"
                </p>
                <p className="text-[12px] text-ink-2 mt-[9px]">
                  {c.visibility ?? (docs.find(d => d.id === c.documentId)?.visibility ?? 'Internal')} · Uploaded {
                    c.uploadedAt
                      ? new Date(c.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : docs.find(d => d.id === c.documentId)
                        ? new Date(docs.find(d => d.id === c.documentId)!.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
