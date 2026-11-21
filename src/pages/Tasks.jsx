import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx'
import { StatusPill, PriorityDot, taskPct } from './Dashboard.jsx'
import { X, Plus, Pin, Trash2, CalendarDays } from 'lucide-react'

const COLS = ['To Do','On Progress','Review','Done']
const statusLabel = { 'To Do':'Belum Mulai','On Progress':'Dikerjakan','Review':'Review','Done':'Selesai' }

export default function Tasks() {
  const [sp, setSp] = useSearchParams()
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [view, setView] = useState(sp.get('view') || 'focus') // focus | table | kanban
  const [filterProject, setFilterProject] = useState('ALL')
  const [filterPrio, setFilterPrio] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [newSub, setNewSub] = useState('')
  const [modal, setModal] = useState(!!sp.get('new'))
  const [form, setForm] = useState({ title:'', project:'Operasional', assignee:'saya', priority:'Sedang', status:'To Do', deadline:'' })
  const today = new Date().toISOString().slice(0,10)

  const sync = () => setDb(loadDB())
  useEffect(() => { if (sp.get('open')) { const t = db.tasks.find(x=>x.id===sp.get('open')); if (t) setSelected(t) } // eslint-disable-line
  }, [])
  useEffect(()=>{ sync(); const t=setInterval(sync,2500); return ()=>clearInterval(t) },[])

  const persist = next => { saveDB(next); setDb(next) }
  const user_ = { name:user.name, teamId:user.teamId }

  const projects = (db.projects||[]).filter(p=>p.teamId===user.teamId)
  const members = db.users.filter(u=>u.teamId===user.teamId && u.status==='active')
  const teamTasks = db.tasks.filter(t=>t.teamId===user.teamId)
  const nameOf = id => members.find(m=>m.id===id)?.name || '—'
  const filtered = teamTasks.filter(t =>
    (filterProject==='ALL' || (t.project||'Operasional')===filterProject) &&
    (filterPrio==='ALL' || (t.priority||'Sedang')===filterPrio))

  const groups = [
    { key:'today', label:'Jatuh Tempo & Hari Ini', dot:'bg-rose-600', items:filtered.filter(t=>t.status!=='Done' && t.deadline && t.deadline<=today) },
    { key:'upcoming', label:'Mendatang (Besok & Minggu Ini)', dot:'bg-amber-600', items:filtered.filter(t=>t.status!=='Done' && t.deadline && t.deadline>today) },
    { key:'unscheduled', label:'Tanpa Tenggat / Selesai', dot:'bg-zinc-400', items:filtered.filter(t=>!t.deadline || t.status==='Done') },
  ]

  const setStatus = (id, status) => {
    const next = { ...db, tasks: db.tasks.map(t=>t.id===id?{...t,status}:t) }
    logAct(next, user_, 'mengubah status tugas menjadi ' + (statusLabel[status]||status), 'refresh-cw')
    persist(next)
  }
  const del = id => { const next={...db, tasks:db.tasks.filter(t=>t.id!==id)}; logAct(next,user_,'menghapus sebuah tugas','trash-2'); persist(next) }
  const togglePin = t => { const next={...db,tasks:db.tasks.map(x=>x.id===t.id?{...x,pinned:!x.pinned}:x)}; persist(next); if (selected?.id===t.id) setSelected({...t,pinned:!t.pinned}) }

  const updateSelected = patch => {
    const next = { ...db, tasks: db.tasks.map(t=>t.id===selected.id ? {...t,...patch} : t) }
    persist(next); setSelected({...selected,...patch})
  }
  const addSubtask = e => {
    e.preventDefault(); if (!newSub.trim()) return
    const subtasks = [...(selected.subtasks||[]), { id:'s'+Date.now(), text:newSub.trim(), done:false }]
    updateSelected({ subtasks }); setNewSub('')
  }
  const toggleSub = sub => updateSelected({ subtasks: selected.subtasks.map(s=>s.id===sub.id?{...s,done:!s.done}:s) })
  const removeSub = sub => updateSelected({ subtasks: selected.subtasks.filter(s=>s.id!==sub.id) })

  const addTask = e => {
    e.preventDefault()
    if (!form.title.trim()) return
    const t = { id:'t'+Date.now(), teamId:user.teamId, title:form.title.trim(), assignee: form.assignee==='saya'?user.id:form.assignee,
      status:form.status, priority:form.priority, project:form.project, pinned:form.deadline===today,
      deadline:form.deadline, note:'', subtasks:[] }
    const next = {...db, tasks:[t, ...db.tasks]}
    logAct(next, user_, 'menambahkan tugas "' + t.title + '"', 'plus')
    persist(next); setModal(false); setForm({ title:'', project:'Operasional', assignee:'saya', priority:'Sedang', status:'To Do', deadline:'' })
    setSp({})
  }

  const snooze = t => { const d = new Date(Date.now()+864e5).toISOString().slice(0,10)
    const next={...db,tasks:db.tasks.map(x=>x.id===t.id?{...x,deadline:d}:x)}; logAct(next,user_,'menunda tenggat tugas ke besok','clock'); persist(next) }

  const rowCls = 'flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas dark:hover:bg-zinc-800/40 cursor-pointer transition'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Header & view switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-ink dark:text-white">Tugas, Proyek & Tenggat</h1>
          <p className="text-xs text-inksoft dark:text-zinc-400">Kelola seluruh pekerjaan tim dalam daftar fokus, tabel, atau papan kanban.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-subtle p-0.5 dark:border-zinc-800 dark:bg-zinc-950 self-start sm:self-auto">
          {[['focus','Daftar Fokus'],['table','Tabel'],['kanban','Kanban']].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)} className={'rounded-md px-2.5 py-1.5 text-xs font-medium transition '+(view===k?'bg-white text-ink shadow-hairline dark:bg-zinc-800 dark:text-white':'text-inksoft hover:text-ink')}>
              {l}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterProject} onChange={e=>setFilterProject(e.target.value)} className="field w-auto font-medium">
            <option value="ALL">Semua Proyek / Area</option>
            {projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select value={filterPrio} onChange={e=>setFilterPrio(e.target.value)} className="field w-auto font-medium">
            <option value="ALL">Semua Prioritas</option><option value="Tinggi">Tinggi</option><option value="Sedang">Sedang</option><option value="Rendah">Rendah</option>
          </select>
        </div>
        <button onClick={()=>setModal(true)} className="btn-dark"><Plus className="h-3.5 w-3.5" strokeWidth={1.5}/>Pekerjaan Baru</button>
      </div>

      {/* Focus view */}
      {view==='focus' && <div className="space-y-4">
        {groups.map(g=>(
          <div key={g.key} className="rounded-xl border border-line bg-white shadow-hairline overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <span className={'h-1.5 w-1.5 rounded-full '+g.dot}/>
                <span className="text-xs font-semibold text-ink dark:text-white">{g.label}</span>
                <span className="font-mono text-[11px] text-dim">({g.items.length})</span>
              </div>
            </div>
            <div className="divide-y divide-line dark:divide-zinc-800">
              {g.items.map(t=>(
                <div key={t.id} onClick={()=>setSelected(t)} className={rowCls}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-inksoft w-8 shrink-0">{taskPct(t)}%</span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-ink dark:text-zinc-100 truncate flex items-center gap-1.5">
                        {t.pinned && <Pin className="h-3 w-3 text-indigo-600 shrink-0" strokeWidth={2}/>}{t.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-inksoft">
                        <span>{t.project||'Operasional'}</span><span>•</span>
                        <span>PIC: <b className="text-ink dark:text-zinc-200">{nameOf(t.assignee)}</b></span>
                        {t.subtasks?.length>0 && <span className="font-mono text-[10px]">• {t.subtasks.filter(s=>s.done).length}/{t.subtasks.length} sub-tugas</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {t.status!=='Done' && t.deadline && <button onClick={e=>{e.stopPropagation(); snooze(t)}} title="Tunda ke besok"
                      className="rounded-md border border-line bg-white px-2 py-1 text-[10px] font-medium text-inksoft hover:text-ink dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">+1 Hari</button>}
                    <span className="hidden sm:inline font-mono text-[11px] text-inksoft">{t.deadline||'—'}</span>
                    <StatusPill s={t.status}/>
                  </div>
                </div>
              ))}
              {g.items.length===0 && <p className="px-4 py-4 text-xs text-dim">Tidak ada pekerjaan pada kelompok ini.</p>}
            </div>
          </div>
        ))}
      </div>}

      {/* Table view */}
      {view==='table' && <div className="rounded-xl border border-line bg-white shadow-hairline overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-line bg-canvas text-[10px] font-semibold uppercase tracking-wider text-dim dark:border-zinc-800 dark:bg-zinc-950/50">
                <th className="py-3 px-4">Judul Pekerjaan</th><th className="py-3 px-3">Proyek</th><th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Progres</th><th className="py-3 px-3">Prioritas</th><th className="py-3 px-3">PIC</th>
                <th className="py-3 px-4 text-right">Tenggat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-zinc-800">
              {filtered.map(t=>(
                <tr key={t.id} onClick={()=>setSelected(t)} className="hover:bg-canvas dark:hover:bg-zinc-800/40 cursor-pointer">
                  <td className="py-3 px-4 font-medium text-ink dark:text-zinc-100">
                    <div className="flex items-center gap-2">{t.pinned && <Pin className="h-3 w-3 text-indigo-600 shrink-0" strokeWidth={2}/>}<span>{t.title}</span></div>
                  </td>
                  <td className="py-3 px-3 text-inksoft">{t.project||'Operasional'}</td>
                  <td className="py-3 px-3" onClick={e=>e.stopPropagation()}>
                    <select value={t.status} onChange={e=>setStatus(t.id,e.target.value)}
                      className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {COLS.map(c=><option key={c} value={c}>{statusLabel[c]}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3"><div className="flex items-center gap-2">
                    <div className="h-1 w-14 overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-ink dark:bg-zinc-100" style={{width:taskPct(t)+'%'}}/></div>
                    <span className="font-mono text-[10px]">{taskPct(t)}%</span></div></td>
                  <td className="py-3 px-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium"><PriorityDot p={t.priority}/>{t.priority||'Sedang'}</span></td>
                  <td className="py-3 px-3 text-inksoft font-medium">{nameOf(t.assignee)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-inksoft">{t.deadline||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <p className="p-8 text-center text-xs text-dim">Belum ada tugas. Tambahkan pekerjaan pertama tim Anda.</p>}
      </div>}

      {/* Kanban */}
      {view==='kanban' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLS.map(col=>(
          <div key={col} className="rounded-xl border border-line bg-subtle/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{ const id=e.dataTransfer.getData('id'); if(id) setStatus(id,col) }}>
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="flex items-center gap-2">
                <span className={'h-1.5 w-1.5 rounded-full '+(col==='To Do'?'bg-zinc-400':col==='On Progress'?'bg-indigo-600':col==='Review'?'bg-amber-500':'bg-emerald-600')}/>
                <span className="text-xs font-semibold text-ink dark:text-white">{statusLabel[col]}</span>
                <span className="font-mono text-[11px] text-dim">{filtered.filter(t=>t.status===col).length}</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {filtered.filter(t=>t.status===col).map(t=>(
                <div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData('id',t.id)} onClick={()=>setSelected(t)}
                  className="rounded-lg border border-line bg-white p-3.5 shadow-hairline hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer transition">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] text-inksoft">{t.project||'Operasional'}</span>
                    <PriorityDot p={t.priority}/>
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-ink dark:text-zinc-100 leading-snug">{t.title}</h3>
                  {t.subtasks?.length>0 && <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-dim mb-1">
                      <span>{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length} langkah</span><span>{taskPct(t)}%</span></div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-ink dark:bg-zinc-100" style={{width:taskPct(t)+'%'}}/></div>
                  </div>}
                  <div className="mt-3 pt-2.5 border-t border-line dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-ink dark:text-zinc-300">{nameOf(t.assignee)}</span>
                    <span className="font-mono text-[10px] text-dim">{t.deadline||'—'}</span>
                  </div>
                </div>
              ))}
              {filtered.filter(t=>t.status===col).length===0 && <p className="px-2 py-4 text-center text-[11px] text-dim">Kosong</p>}
            </div>
          </div>
        ))}
      </div>}

      {/* New task modal */}
      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div onClick={()=>setModal(false)} className="fixed inset-0 bg-zinc-950/30"/>
        <form onSubmit={addTask} className="relative z-10 w-full max-w-md rounded-xl border border-line bg-white p-5 shadow-float space-y-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink dark:text-white">Tambah Pekerjaan / Pengingat</h3>
            <button type="button" onClick={()=>setModal(false)} className="text-dim hover:text-ink"><X className="h-4 w-4" strokeWidth={1.5}/></button>
          </div>
          <input required autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Judul pekerjaan..." className="field !text-sm font-medium"/>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><Label className="text-[11px]">Proyek / Area</Label>
              <select value={form.project} onChange={e=>setForm({...form,project:e.target.value})} className="field">
                <option>Operasional</option>{projects.map(p=><option key={p.id}>{p.name}</option>)}</select></label>
            <label className="space-y-1"><Label className="text-[11px]">PIC</Label>
              <select value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} className="field">
                <option value="saya">Saya</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <label className="space-y-1"><Label className="text-[11px]">Prioritas</Label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="field">
                <option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></label>
            <label className="space-y-1"><Label className="text-[11px]">Status</Label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="field">
                {COLS.map(c=><option key={c} value={c}>{statusLabel[c]}</option>)}</select></label>
          </div>
          <label className="space-y-1 block"><Label className="text-[11px]">Tenggat Waktu</Label>
            <Input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="field"/></label>
          <button type="submit" className="btn-dark w-full !py-2">Simpan Pekerjaan</button>
        </form>
      </div>}

      {/* Detail drawer */}
      {selected && <div className="fixed inset-0 z-50 flex justify-end">
        <div onClick={()=>{setSelected(null); setSp({})}} className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[1px]"/>
        <div className="relative z-10 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-line dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-zinc-800">
            <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Detail Pekerjaan</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>togglePin(selected)} className={'rounded p-1.5 hover:bg-subtle '+(selected.pinned?'text-indigo-600':'text-dim')} title="Sematkan"><Pin className="h-4 w-4" strokeWidth={1.5}/></button>
              <button onClick={()=>{del(selected.id); setSelected(null); setSp({})}} className="rounded p-1.5 text-dim hover:text-rose-600" title="Hapus"><Trash2 className="h-4 w-4" strokeWidth={1.5}/></button>
              <button onClick={()=>{setSelected(null); setSp({})}} className="rounded p-1.5 text-dim hover:text-ink"><X className="h-4 w-4" strokeWidth={1.5}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <input value={selected.title} onChange={e=>updateSelected({title:e.target.value})} className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-semibold focus:border-indigo-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"/>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1"><Label className="text-[11px]">Status</Label>
                <select value={selected.status} onChange={e=>updateSelected({status:e.target.value})} className="field">
                  {COLS.map(c=><option key={c} value={c}>{statusLabel[c]}</option>)}</select></label>
              <label className="space-y-1"><Label className="text-[11px]">Prioritas</Label>
                <select value={selected.priority||'Sedang'} onChange={e=>updateSelected({priority:e.target.value})} className="field">
                  <option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></label>
              <label className="space-y-1"><Label className="text-[11px]">Proyek / Area</Label>
                <select value={selected.project||'Operasional'} onChange={e=>updateSelected({project:e.target.value})} className="field">
                  <option>Operasional</option>{projects.map(p=><option key={p.id}>{p.name}</option>)}</select></label>
              <label className="space-y-1"><Label className="text-[11px]">Tenggat</Label>
                <input type="date" value={selected.deadline||''} onChange={e=>updateSelected({deadline:e.target.value})} className="field font-mono"/></label>
            </div>
            <div className="rounded-lg border border-line bg-canvas p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-inksoft">Progres Tugas Ini</span>
                <span className="font-mono font-semibold text-ink dark:text-white">{taskPct(selected)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
                <div className="h-full rounded-full bg-ink dark:bg-zinc-100 transition-all" style={{width:taskPct(selected)+'%'}}/>
              </div>
            </div>
            <label className="space-y-1 block"><Label className="text-[11px]">Catatan & Konteks</Label>
              <textarea value={selected.note||''} onChange={e=>updateSelected({note:e.target.value})} rows={3} placeholder="Tuliskan detail penting agar tidak lupa..." className="field leading-relaxed"/></label>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-dim">Sub-Tugas / Langkah Kerja</Label>
                {selected.subtasks?.length>0 && <span className="font-mono text-[10px] text-inksoft">{selected.subtasks.filter(s=>s.done).length}/{selected.subtasks.length} selesai</span>}
              </div>
              <div className="space-y-2">
                {(selected.subtasks||[]).map(sub=>(
                  <div key={sub.id} className="flex items-center gap-2.5 rounded-lg border border-line p-2 dark:border-zinc-800">
                    <input type="checkbox" checked={sub.done} onChange={()=>toggleSub(sub)} className="h-4 w-4 rounded border-zinc-300 cursor-pointer accent-zinc-900"/>
                    <input value={sub.text} onChange={e=>updateSelected({subtasks:selected.subtasks.map(s=>s.id===sub.id?{...s,text:e.target.value}:s)})}
                      className={'w-full bg-transparent text-xs focus:outline-none '+(sub.done?'line-through text-dim':'')}/>
                    <button onClick={()=>removeSub(sub)} className="text-dim hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                  </div>
                ))}
              </div>
              <form onSubmit={addSubtask} className="mt-2 flex gap-2">
                <input value={newSub} onChange={e=>setNewSub(e.target.value)} placeholder="Tambah langkah kerja..." className="field"/>
                <button type="submit" className="rounded-lg border border-line bg-canvas px-3 text-xs font-medium hover:bg-subtle">+</button>
              </form>
            </div>
          </div>
          <div className="border-t border-line p-4 flex justify-end dark:border-zinc-800">
            <button onClick={()=>{setSelected(null); setSp({})}} className="btn-dark !px-4 !py-2">Selesai</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
