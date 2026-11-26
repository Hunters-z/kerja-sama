import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { DOC_TEMPLATES } from '@/components/Shell.jsx'
import { FileText, Trash2, ChevronUp, ChevronDown, Info, Plus, Shapes, Check } from 'lucide-react'

const ICONS = ['file-text','book-open','target','briefcase','clipboard-list','lightbulb','layers','folder','check-square','calendar','compass','shield-check','bookmark','award','cpu']
const ICON_MAP = { 'file-text':FileText, 'book-open':FileText, 'target':FileText, 'briefcase':FileText, 'clipboard-list':FileText,
  'lightbulb':FileText, 'layers':FileText, 'folder':FileText, 'check-square':FileText, 'calendar':FileText,
  'compass':FileText, 'shield-check':FileText, 'bookmark':FileText, 'award':FileText, 'cpu':FileText }
const TPL_ICON = { users:FileText, 'book-open':FileText, target:FileText, 'check-square':FileText }

export default function Documents() {
  const [sp, setSp] = useSearchParams()
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const docs = (db.docs||[]).filter(d=>d.teamId===user.teamId)
  const [activeId, setActiveId] = useState(sp.get('id') || (sp.get('new') ? '' : docs[0]?.id || ''))
  const [tplOpen, setTplOpen] = useState(!!sp.get('new'))
  const [iconOpen, setIconOpen] = useState(false)
  const active = docs.find(d=>d.id===activeId) || null

  const persist = next => { saveDB(next); setDb(next) }
  const log = (next, action) => logAct(next, {name:user.name, teamId:user.teamId}, action, 'file-text')

  const createDoc = tpl => {
    const d = { id:'d'+Date.now(), teamId:user.teamId, icon:tpl.icon||'file-text', title:tpl.name, category:tpl.category||'Umum',
      pic:user.name, updatedAt:'Baru saja', blocks:(tpl.blocks||[]).map((b,i)=>({...b, id:'b'+Date.now()+'-'+i})) }
    const next = {...db, docs:[...(db.docs||[]), d]}
    log(next, 'membuat dokumen "'+d.title+'"')
    persist(next); setTplOpen(false); setActiveId(d.id); setSp({})
  }
  const updateDoc = patch => {
    const next = { ...db, docs:(db.docs||[]).map(d=>d.id===active.id?{...d,...patch, updatedAt:'Baru saja'}:d) }
    persist(next)
  }
  const delDoc = () => { if (!confirm('Hapus dokumen ini?')) return
    const next = {...db, docs:(db.docs||[]).filter(d=>d.id!==active.id)}
    log(next, 'menghapus dokumen "'+active.title+'"')
    persist(next); setActiveId(docs.find(d=>d.id!==active.id)?.id || ''); }

  const addBlock = type => updateDoc({ blocks:[...active.blocks, { id:'b'+Date.now()+Math.random(), type, content:'', checked:false }] })
  const setBlock = (idx, patch) => updateDoc({ blocks:active.blocks.map((b,i)=>i===idx?{...b,...patch}:b) })
  const removeBlock = idx => updateDoc({ blocks:active.blocks.filter((_,i)=>i!==idx) })
  const moveBlock = (idx, dir) => { const t = idx+dir; if (t<0 || t>=active.blocks.length) return
    const blocks=[...active.blocks]; [blocks[idx],blocks[t]]=[blocks[t],blocks[idx]]; updateDoc({blocks}) }

  if (!active && !tplOpen) return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold text-ink dark:text-white">Dokumen & Catatan</h1>
        <button onClick={()=>setTplOpen(true)} className="btn-dark"><Plus className="h-3.5 w-3.5" strokeWidth={1.5}/>Dokumen Baru</button>
      </div>
      {docs.length===0 ? <div className="rounded-xl border border-dashed border-line p-10 text-center text-xs text-dim">
        <FileText className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5}/>Belum ada dokumen. Buat dari template untuk mulai.</div> :
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {docs.map(d=><button key={d.id} onClick={()=>setActiveId(d.id)} className="rounded-xl border border-line bg-surface p-4 text-left shadow-hairline hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
          <FileText className="h-4 w-4 text-inksoft mb-2" strokeWidth={1.5}/>
          <p className="text-sm font-semibold text-ink dark:text-white">{d.title}</p>
          <p className="text-[11px] text-dim mt-0.5">{d.category} • {d.pic}</p>
        </button>)}
      </div>}
      {tplOpen && <TemplateModal onClose={()=>setTplOpen(false)} onPick={createDoc}/>}
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-line bg-surface shadow-hairline overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-2 mb-5 text-xs">
              <button onClick={()=>setSp({})} className="text-dim hover:text-ink">← Semua Dokumen</button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-dim flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" strokeWidth={2}/> Tersimpan</span>
                <button onClick={delDoc} className="text-dim hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
              </div>
            </div>
            <div className="relative flex items-center gap-3 mb-5">
              <button onClick={()=>setIconOpen(v=>!v)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-canvas text-ink hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                <Shapes className="h-4 w-4" strokeWidth={1.5}/></button>
              {iconOpen && <div className="absolute left-0 top-12 z-20 grid grid-cols-5 gap-1.5 rounded-xl border border-line bg-surface p-2.5 shadow-float w-48 dark:border-zinc-700 dark:bg-zinc-800">
                {ICONS.map(ic=><button key={ic} onClick={()=>{updateDoc({icon:ic}); setIconOpen(false)}} className="grid h-8 w-8 place-items-center rounded-lg text-inksoft hover:bg-subtle"><FileText className="h-4 w-4" strokeWidth={1.5}/></button>)}
              </div>}
              <input value={active.title} onChange={e=>updateDoc({title:e.target.value})} placeholder="Judul Dokumen..."
                className="w-full bg-transparent text-xl sm:text-2xl font-semibold tracking-tight text-ink placeholder-dim focus:outline-none dark:text-white"/>
            </div>
            <div className="mb-6 rounded-lg border border-line bg-canvas p-3 text-xs space-y-2 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2">
                <span className="text-dim">Kategori</span>
                <input value={active.category} onChange={e=>updateDoc({category:e.target.value})} className="col-span-2 sm:col-span-3 bg-transparent font-medium text-ink focus:outline-none dark:text-zinc-200"/>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2">
                <span className="text-dim">Penanggung Jawab</span>
                <input value={active.pic} onChange={e=>updateDoc({pic:e.target.value})} className="col-span-2 sm:col-span-3 bg-transparent font-medium text-ink focus:outline-none dark:text-zinc-200"/>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2">
                <span className="text-dim">Diperbarui</span>
                <span className="col-span-2 sm:col-span-3 font-mono text-[11px] text-inksoft">{active.updatedAt}</span>
              </div>
            </div>

            <div className="space-y-2">
              {active.blocks.map((b,idx)=>(
                <div key={b.id} className="group relative flex items-start gap-2 rounded-lg p-1 hover:bg-canvas dark:hover:bg-zinc-800/40">
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 pt-1 shrink-0">
                    <button onClick={()=>moveBlock(idx,-1)} disabled={idx===0} className="p-0.5 text-dim hover:text-ink disabled:opacity-25"><ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                    <button onClick={()=>moveBlock(idx,1)} disabled={idx===active.blocks.length-1} className="p-0.5 text-dim hover:text-ink disabled:opacity-25"><ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    {b.type==='h1' && <input value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} placeholder="Judul Bagian..." className="w-full bg-transparent text-lg font-semibold text-ink focus:outline-none dark:text-white"/>}
                    {b.type==='h2' && <input value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} placeholder="Sub-judul..." className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none dark:text-zinc-100 mt-1"/>}
                    {b.type==='paragraph' && <textarea value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} rows={2} placeholder="Tulis paragraf..." className="w-full resize-none bg-transparent text-xs sm:text-sm leading-relaxed text-inksoft focus:outline-none dark:text-zinc-300"/>}
                    {b.type==='todo' && <div className="flex items-center gap-2.5 py-0.5">
                      <input type="checkbox" checked={!!b.checked} onChange={e=>setBlock(idx,{checked:e.target.checked})} className="h-4 w-4 rounded cursor-pointer accent-zinc-900"/>
                      <input value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} placeholder="Item checklist..." className={'w-full bg-transparent text-xs sm:text-sm focus:outline-none '+(b.checked?'line-through text-dim':'text-ink dark:text-zinc-200')}/>
                    </div>}
                    {b.type==='bullet' && <div className="flex items-center gap-2.5 py-0.5">
                      <span className="text-dim">•</span>
                      <input value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} placeholder="Poin catatan..." className="w-full bg-transparent text-xs sm:text-sm text-ink focus:outline-none dark:text-zinc-200"/>
                    </div>}
                    {b.type==='callout' && <div className="flex items-start gap-2.5 rounded-lg border border-line bg-canvas p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                      <Info className="h-4 w-4 text-inksoft mt-0.5 shrink-0" strokeWidth={1.5}/>
                      <textarea value={b.content} onChange={e=>setBlock(idx,{content:e.target.value})} rows={2} placeholder="Sorotan informasi penting..." className="w-full resize-none bg-transparent text-xs sm:text-sm text-ink focus:outline-none dark:text-zinc-200"/>
                    </div>}
                    {b.type==='divider' && <hr className="my-2 border-line dark:border-zinc-800"/>}
                  </div>
                  <button onClick={()=>removeBlock(idx)} className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1 text-dim hover:text-rose-600 shrink-0"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-line dark:border-zinc-800">
              <div className="flex flex-wrap gap-1.5">
                {[['h2','+ Sub-Judul'],['paragraph','+ Paragraf'],['todo','+ Checklist'],['bullet','+ Poin'],['callout','+ Sorotan'],['divider','+ Garis']].map(([t,l])=>(
                  <button key={t} onClick={()=>addBlock(t)} className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-inksoft hover:text-ink dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {tplOpen && <TemplateModal onClose={()=>setTplOpen(false)} onPick={createDoc}/>}
    </div>
  )
}

function TemplateModal({onClose, onPick}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div onClick={onClose} className="fixed inset-0 bg-zinc-950/30"/>
    <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-float space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink dark:text-white">Buat Halaman Dokumen Baru</h3>
          <p className="text-[11px] text-inksoft">Pilih struktur template universal sesuai kebutuhan.</p>
        </div>
        <button onClick={onClose} className="text-dim hover:text-ink">✕</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {DOC_TEMPLATES.map(tpl=>{
          const Icon = TPL_ICON[tpl.icon] || FileText
          return (
          <button key={tpl.name} onClick={()=>onPick(tpl)} className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Icon className="h-4 w-4" strokeWidth={1.5}/>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink dark:text-white">{tpl.name}</p>
              <p className="mt-0.5 text-[11px] text-inksoft leading-snug">{tpl.category}</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  </div>
}
