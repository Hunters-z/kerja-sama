import { useState } from 'react'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { taskPct } from './Dashboard.jsx'
import { Plus, CalendarDays, ListChecks } from 'lucide-react'

export default function Projects() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', deadline:'' })

  const persist = next => { saveDB(next); setDb(next) }
  const projects = (db.projects||[]).filter(p=>p.teamId===user.teamId)
  const tasks = db.tasks.filter(t=>t.teamId===user.teamId)

  const list = projects.map(p => {
    const pt = tasks.filter(t=>(t.project||'Operasional')===p.name)
    const wsum = pt.reduce((a,t)=>a+taskPct(t),0)
    return { ...p, tasks:pt, total:pt.length, completed:pt.filter(t=>t.status==='Done').length,
      percent: pt.length ? Math.round(wsum/pt.length) : 0 }
  })
  const overall = tasks.length ? Math.round(tasks.reduce((a,t)=>a+taskPct(t),0)/tasks.length) : 0

  const addProject = e => {
    e.preventDefault(); if (!form.name.trim()) return
    const next = { ...db, projects:[...(db.projects||[]), { id:'p'+Date.now(), teamId:user.teamId, name:form.name.trim(), description:form.description, deadline:form.deadline }] }
    logAct(next, {name:user.name, teamId:user.teamId}, 'membuat proyek "'+form.name.trim()+'"', 'folder-plus')
    persist(next); setModal(false); setForm({ name:'', description:'', deadline:'' })
  }
  const delProject = p => {
    if (!confirm('Hapus proyek "'+p.name+'"? Tugas di dalamnya menjadi Operasional.')) return
    const next = { ...db, projects: db.projects.filter(x=>x.id!==p.id),
      tasks: db.tasks.map(t=>(t.project||'')===p.name?{...t,project:'Operasional'}:t) }
    logAct(next, {name:user.name, teamId:user.teamId}, 'menghapus proyek "'+p.name+'"', 'trash-2')
    persist(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-ink dark:text-white">Proyek & Progres Pekerjaan</h1>
          <p className="text-xs text-inksoft mt-0.5">Persentase penyelesaian dihitung otomatis dari status & langkah kerja tiap tugas.</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-dark self-start sm:self-auto !px-3.5 !py-2"><Plus className="h-3.5 w-3.5" strokeWidth={1.5}/>Proyek Baru</button>
      </div>

      <div className="rounded-xl border border-line bg-white p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">Akumulasi Seluruh Ruang Kerja</span>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="font-mono text-2xl sm:text-3xl font-semibold text-ink dark:text-white">{overall}%</span>
              <span className="text-xs text-inksoft">{tasks.filter(t=>t.status==='Done').length} dari {tasks.length} pekerjaan selesai</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">{tasks.filter(t=>t.status==='Done').length} Selesai</span>
            <span className="rounded-full bg-zinc-50 px-2.5 py-0.5 font-medium text-zinc-700">{tasks.filter(t=>t.status==='On Progress'||t.status==='Review').length} Berjalan</span>
            <span className="rounded-full bg-subtle px-2.5 py-0.5 font-medium text-inksoft">{tasks.filter(t=>t.status==='To Do').length} Belum Mulai</span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
          <div className="h-full rounded-full bg-ink dark:bg-zinc-100 transition-all" style={{width:overall+'%'}}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(p=>(
          <div key={p.id} className="flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink dark:text-white">{p.name}</h3>
                    {p.percent===100 && p.total>0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Tuntas</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-inksoft dark:text-zinc-400">{p.description}</p>
                </div>
                <span className="font-mono text-base font-semibold text-ink dark:text-white shrink-0">{p.percent}%</span>
              </div>
              <div className="mt-3 mb-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
                <div className={'h-full rounded-full transition-all duration-300 '+(p.percent===100 && p.total>0?'bg-emerald-600':'bg-ink dark:bg-zinc-100')} style={{width:p.percent+'%'}}/>
              </div>
              <div className="flex items-center justify-between text-[11px] text-inksoft mb-4">
                <span className="font-mono">{p.completed}/{p.total} pekerjaan selesai</span>
                {p.deadline ? <span className="flex items-center gap-1 font-mono text-[10px] text-dim"><CalendarDays className="h-3 w-3" strokeWidth={1.5}/>{p.deadline}</span> : <span/>}
              </div>
              <div className="border-t border-line pt-3 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">Daftar Pekerjaan</span>
                  <button onClick={()=>delProject(p)} className="text-[11px] font-medium text-dim hover:text-rose-600">Hapus Proyek</button>
                </div>
                <div className="space-y-1.5">
                  {p.tasks.map(t=>(
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas dark:hover:bg-zinc-800/50">
                      <span className={'text-xs truncate '+(t.status==='Done'?'line-through text-dim':'text-ink dark:text-zinc-200')}>{t.title}</span>
                      <span className="font-mono text-[10px] text-dim shrink-0">{taskPct(t)}%</span>
                    </div>
                  ))}
                  {p.tasks.length===0 && <p className="py-3 text-center text-[11px] text-dim">Belum ada pekerjaan di proyek ini.</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {list.length===0 && <div className="md:col-span-2 rounded-xl border border-dashed border-line p-10 text-center text-xs text-dim">
          <ListChecks className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5}/>Belum ada proyek. Buat proyek pertama untuk melacak progres tim.</div>}
      </div>

      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div onClick={()=>setModal(false)} className="fixed inset-0 bg-zinc-950/30"/>
        <form onSubmit={addProject} className="relative z-10 w-full max-w-md rounded-xl border border-line bg-white p-5 shadow-float space-y-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-ink dark:text-white">Proyek Baru</h3>
          <input required autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nama proyek..." className="field !text-sm font-medium"/>
          <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} placeholder="Deskripsi singkat..." className="field"/>
          <label className="space-y-1 block"><span className="text-[11px] font-medium text-inksoft">Tenggat Proyek</span>
            <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="field font-mono"/></label>
          <button type="submit" className="btn-dark w-full !py-2">Buat Proyek</button>
        </form>
      </div>}
    </div>
  )
}
