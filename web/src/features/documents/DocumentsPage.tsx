import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, ChevronDown, Check, RotateCcw, Trash2, FileText } from 'lucide-react'
import { documentsApi } from '../../api/documents'
import { queryKeys } from '../../lib/queryKeys'
import type { Document, DocumentVisibility } from '../../types/api'

const ALLOWED_EXT = ['.pdf', '.md', '.txt']
const MAX_BYTES = 10 * 1024 * 1024

export function DocumentsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visFilter, setVisFilter] = useState('')

  const { data: docs = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: documentsApi.list,
    refetchInterval: q => q.state.data?.some(d => d.status === 'Processing') ? 5000 : false,
  })

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: ({ file, vis }: { file: File; vis: DocumentVisibility }) => documentsApi.upload(file, vis),
    onSuccess: () => { setUploadError(null); qc.invalidateQueries({ queryKey: queryKeys.documents.all() }) },
    onError: () => setUploadError('Upload failed. Please try again.'),
  })

  const { mutate: updateVis } = useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: DocumentVisibility }) => documentsApi.updateVisibility(id, visibility),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents.all() }),
  })

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => { setDeleteTarget(null); qc.invalidateQueries({ queryKey: queryKeys.documents.all() }) },
  })

  function validate(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) { setUploadError(`Unsupported type. Use ${ALLOWED_EXT.join(', ')}.`); return false }
    if (file.size > MAX_BYTES) { setUploadError('File exceeds 10 MB.'); return false }
    return true
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f && validate(f)) upload({ file: f, vis: 'Internal' })
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && validate(f)) upload({ file: f, vis: 'Internal' })
  }

  const filtered = docs.filter(d => {
    if (search && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && d.status !== statusFilter) return false
    if (visFilter && d.visibility !== visFilter) return false
    return true
  })

  return (
    <section className="px-10 py-8 pb-24 max-w-screen w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-page-title">Documents</h1>
          <p className="text-body text-ink-2 mt-1">Upload the policies, runbooks and FAQs OpsIQ can answer from. Public documents can also power your website widget.</p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn btn-primary">
          <Upload size={18} strokeWidth={1.75} />Upload document
        </button>
      </div>

      {/* Drop zone — always tall/centered */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-[1.5px] border-dashed rounded mb-5 py-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${isDragging ? 'border-accent bg-tint/30' : 'border-[#C4CCD8] bg-white hover:border-accent'}`}
      >
        <div className="w-14 h-14 rounded-[14px] bg-tint text-accent grid place-items-center">
          <Upload size={26} strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h3 className="text-[15px] font-semibold">{uploading ? 'Uploading…' : 'Drag and drop files here'}</h3>
          <p className="text-[13px] text-ink-2 mt-[3px]">PDF, Markdown or text · up to 10 MB each</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>Browse files</button>
      </div>

      <input ref={fileRef} type="file" accept={ALLOWED_EXT.join(',')} className="hidden" onChange={handleFile} />

      {uploadError && (
        <div className="text-[13px] text-fail-ink bg-fail-bg px-4 py-3 rounded-sm mb-4 flex items-center justify-between">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="border-none bg-transparent cursor-pointer text-fail-ink text-lg leading-none">×</button>
        </div>
      )}

      {/* Empty message */}
      {docs.length === 0 && !isLoading && (
        <div className="text-center py-6">
          <h2 className="text-[22px] font-bold text-ink">No documents yet</h2>
          <p className="text-body text-ink-2 mt-1">Upload your first policy, runbook or FAQ and OpsIQ will index it.</p>
        </div>
      )}

      {/* Toolbar */}
      {docs.length > 0 && <div className="flex gap-[10px] mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]" strokeWidth={1.75} />
          <input className="inp pl-[38px] shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)] border-line" placeholder="Search by name" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="h-control px-[14px] pr-9 border border-line rounded-sm bg-card font-sans text-body font-medium text-ink cursor-pointer appearance-none shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Ready">Ready</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" strokeWidth={1.75} />
        </div>
        <div className="relative">
          <select className="h-control px-[14px] pr-9 border border-line rounded-sm bg-card font-sans text-body font-medium text-ink cursor-pointer appearance-none shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)]" value={visFilter} onChange={e => setVisFilter(e.target.value)}>
            <option value="">All visibility</option>
            <option value="Internal">Internal</option>
            <option value="Public">Public</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" strokeWidth={1.75} />
        </div>
      </div>}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : docs.length > 0 && (
        <div className="overflow-x-auto border border-line rounded bg-card shadow-[0_1px_4px_rgba(16,24,40,.10),_0_1px_2px_rgba(16,24,40,.06)]">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                {['Name', 'Status', 'Visibility', 'Uploaded', ''].map(h => (
                  <th key={h} className="text-left px-[18px] py-3 text-[11.5px] font-semibold tracking-[0.05em] uppercase text-ink-2 border-b border-line bg-[#FAFBFC] whitespace-nowrap" style={h === '' ? { textAlign: 'right' } : {}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <DocRow key={doc.id} doc={doc} onVisChange={vis => updateVis({ id: doc.id, visibility: vis })} onDelete={() => setDeleteTarget(doc)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal doc={deleteTarget} isPending={deleting} onConfirm={() => remove(deleteTarget.id)} onClose={() => setDeleteTarget(null)} />
      )}
    </section>
  )
}

function DocRow({ doc, onVisChange, onDelete }: { doc: Document; onVisChange: (v: DocumentVisibility) => void; onDelete: () => void }) {
  return (
    <tr className="hover:bg-[#FAFBFC] border-b border-line-soft last:border-b-0">
      <td className="px-[18px] py-[15px]">
        <div className="flex gap-3 items-start">
          <div className={`w-[34px] h-[34px] rounded-sm grid place-items-center flex-none ${doc.status === 'Failed' ? 'bg-fail-bg text-fail-ink' : 'bg-[#EEF0F3] text-ink-2'}`}>
            <FileText size={17} strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-[13.5px] text-ink">{doc.fileName}</div>
            <div className="text-[12px] text-ink-2 mt-[2px]">
              {doc.status === 'Processing' ? 'Embedding…' : doc.contentType ?? ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-[18px] py-[15px]">
        {doc.status === 'Ready' && <span className="badge badge-ready"><Check size={13} strokeWidth={2} />Ready</span>}
        {doc.status === 'Processing' && <span className="badge badge-processing"><div className="w-[13px] h-[13px] border-[1.5px] border-warn-ink border-t-transparent rounded-full animate-spin" />Processing</span>}
        {doc.status === 'Failed' && <span className="badge badge-failed"><span className="text-[13px]">✕</span>Failed</span>}
      </td>
      <td className="px-[18px] py-[15px]">
        <div className="relative inline-flex items-center">
          <select
            value={doc.visibility}
            onChange={e => onVisChange(e.target.value as DocumentVisibility)}
            className={`appearance-none h-control-sm pl-[11px] pr-[30px] rounded-full border font-semibold text-[12px] cursor-pointer ${doc.visibility === 'Public' ? 'bg-tint text-accent border-tint-line' : 'bg-[#EEF0F3] text-ink-2 border-line'}`}
          >
            <option value="Internal">Internal</option>
            <option value="Public">Public</option>
          </select>
          <ChevronDown size={14} className="absolute right-[9px] pointer-events-none text-current" strokeWidth={1.75} />
        </div>
      </td>
      <td className="px-[18px] py-[15px] text-[13px] text-ink-2 whitespace-nowrap tabular-nums">
        {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-[18px] py-[15px]">
        <div className="flex gap-1 justify-end">
          {doc.status === 'Failed' && <button className="icon-btn" title="Retry"><RotateCcw size={16} strokeWidth={1.75} /></button>}
          <button className="icon-btn danger" title="Delete" onClick={onDelete}><Trash2 size={16} strokeWidth={1.75} /></button>
        </div>
      </td>
    </tr>
  )
}


function DeleteModal({ doc, isPending, onConfirm, onClose }: { doc: Document; isPending: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-ink/45 z-modal grid place-items-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded shadow-pop w-full max-w-[440px] p-6">
        <h3 className="text-[18px] font-bold flex items-center gap-[10px]">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-fail-bg text-fail-ink grid place-items-center flex-none"><Trash2 size={20} strokeWidth={2} /></span>
          Delete document?
        </h3>
        <p className="text-body text-ink-2 leading-relaxed mt-3">This removes <b className="text-ink">"{doc.fileName}"</b> and everything OpsIQ indexed from it. This can't be undone.</p>
        <div className="flex gap-[10px] justify-end mt-[22px]">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="btn btn-danger btn-sm"><Trash2 size={16} strokeWidth={1.75} />{isPending ? 'Deleting…' : 'Delete document'}</button>
        </div>
      </div>
    </div>
  )
}
