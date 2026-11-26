import { useState, useEffect } from 'react'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { Plus, Vote, Lock, Unlock } from 'lucide-react'

export default function Voting() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ q:'', options:['',''], deadline:'' })

  const persist = next => { saveDB(next); setDb(next) }
  const polls = (db.polls||[]).filter(p=>p.teamId===user.teamId).slice().reverse()

  const vote = (pollId, optIdx) => {
    const next = { ...db, polls:db.polls.map(p=>p.id===pollId ? {...p, votes:{...p.votes, [user.id]:optIdx}} : p) }
    logAct(next, {name:user.name, teamId:user.teamId}, 'memberikan suara pada voting', 'vote')
    persist(next)
  }
  const toggleClose = p => {
    const next = { ...db, polls:db.polls.map(x=>x.id===p.id?{...x, closed: p.by===user.name || user.role==='admin' ? !p.closed : p.closed}:x) }
    persist(next)
  }
  const create = e => {
    e.preventDefault()
    const opts = form.options.filter(o=>o.trim())
    if (!form.q.trim() || opts.length<2) return
    const next = { ...db, polls:[...(db.polls||[]), { id:'p'+Date.now(), teamId:user.teamId, q:form.q.trim(), options:opts, votes:{}, by:user.name, closed:false, deadline:form.deadline }] }
    logAct(next, {name:user.name, teamId:user.teamId}, 'membuat voting "'+form.q.trim()+'"', 'vote')
    persist(next); setModal(false); setForm({ q:'', options:['',''], deadline:'' })
  }

  useEffect(()=>{ const t=setInterval(()=>setDb(loadDB()),2500); return ()=>clearInterval(t) },[])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-ink dark:text-white">Voting & Keputusan Tim</h1>
          <p className="text-xs text-inksoft mt-0.5">Rekam kesepakatan kerja, jadwal rapat, dan prioritas proyek secara transparan.</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-dark self-start sm:self-auto !px-3.5 !py-2"><Plus className="h-3.5 w-3.5" strokeWidth={1.5}/>Buat Voting</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {polls.map(p=>{
          const total = Object.keys(p.votes||{}).length
          const mine = p.votes?.[user.id]
          return (
          <div key={p.id} className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium '+(p.closed?'bg-subtle text-inksoft':'bg-emerald-50 text-emerald-700')}>
                  <span className={'h-1.5 w-1.5 rounded-full '+(p.closed?'bg-zinc-400':'bg-emerald-600')}/>{p.closed?'Keputusan Final':'Aktif'}</span>
                {p.deadline && <span className="font-mono text-[10px] text-dim">{p.deadline}</span>}
              </div>
              <h3 className="text-sm font-semibold text-ink dark:text-white leading-snug mb-1">{p.q}</h3>
              <p className="text-[11px] text-dim mb-4">Oleh <span className="text-inksoft">{p.by}</span> • <span className="font-mono">{total}</span> suara</p>
              <div className="space-y-2">
                {p.options.map((o,i)=>{
                  const count = Object.values(p.votes||{}).filter(v=>v===i).length
                  const pc = total?Math.round(count/total*100):0
                  return (
                    <button key={i} disabled={p.closed} onClick={()=>vote(p.id,i)}
                      className={'relative w-full overflow-hidden rounded-lg border bg-canvas p-2.5 text-left transition hover:border-zinc-400 disabled:cursor-default dark:bg-zinc-950/50 '+(mine===i?'border-zinc-400':'border-line dark:border-zinc-800')}>
                      {total>0 && <div className="absolute inset-y-0 left-0 bg-zinc-500/10 transition-all duration-300" style={{width:pc+'%'}}/>}
                      <div className="relative flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 font-medium text-ink dark:text-zinc-100">
                          {mine===i
                            ? <svg className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                            : <span className="h-3.5 w-3.5 rounded-full border border-dim shrink-0"/>}
                          {o}
                        </span>
                        {total>0 && <span className="font-mono text-[11px] text-inksoft shrink-0">{pc}%</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-dim">Pilihan tunggal</span>
              {(p.by===user.name || user.role==='admin') && (
                <button onClick={()=>toggleClose(p)} className="inline-flex items-center gap-1 text-[11px] font-medium text-inksoft hover:text-ink">
                  {p.closed ? <Unlock className="h-3 w-3" strokeWidth={1.5}/> : <Lock className="h-3 w-3" strokeWidth={1.5}/>}
                  {p.closed?'Buka Kembali':'Kunci Keputusan'}</button>)}
            </div>
          </div>
        )})}
        {polls.length===0 && <div className="md:col-span-2 rounded-xl border border-dashed border-line p-10 text-center text-xs text-dim">
          <Vote className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5}/>Belum ada voting. Buat voting pertama untuk mengambil keputusan tim.</div>}
      </div>

      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div onClick={()=>setModal(false)} className="fixed inset-0 bg-zinc-950/30"/>
        <form onSubmit={create} className="relative z-10 w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-float space-y-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-ink dark:text-white">Buat Voting Keputusan</h3>
          <input required autoFocus value={form.q} onChange={e=>setForm({...form,q:e.target.value})} placeholder="Pertanyaan voting..." className="field !text-sm font-medium"/>
          {form.options.map((o,i)=>(
            <input key={i} value={o} onChange={e=>setForm({...form,options:form.options.map((x,j)=>j===i?e.target.value:x)})} placeholder={'Pilihan '+(i+1)} className="field"/>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={()=>setForm({...form,options:[...form.options,'']})} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-inksoft hover:bg-subtle">+ Pilihan</button>
            {form.options.length>2 && <button type="button" onClick={()=>setForm({...form,options:form.options.slice(0,-1)})} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-dim hover:text-rose-600">− Pilihan</button>}
          </div>
          <label className="space-y-1 block"><span className="text-[11px] font-medium text-inksoft">Batas Waktu (opsional)</span>
            <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="field font-mono"/></label>
          <button type="submit" className="btn-dark w-full !py-2">Publikasikan Voting</button>
        </form>
      </div>}
    </div>
  )
}
