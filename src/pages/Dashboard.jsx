import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadDB, currentUser } from '@/lib/db.js'
import { Card } from '@/components/ui/card.jsx'
import { TrendingUp, ArrowRight, CalendarDays, BellRing, Vote, FolderKanban, FileText, Pin } from 'lucide-react'

export function StatusPill({s}) {
  const map = {'To Do':'bg-subtle text-inksoft','On Progress':'bg-indigo-50 text-indigo-700','Review':'bg-amber-50 text-amber-700','Done':'bg-emerald-50 text-emerald-700'}
  const dot = {'To Do':'bg-zinc-400','On Progress':'bg-indigo-600','Review':'bg-amber-500','Done':'bg-emerald-600'}
  return <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium '+ (map[s]||map['To Do'])}>
    <span className={'h-1.5 w-1.5 rounded-full '+(dot[s]||'bg-zinc-400')}/>{s==='To Do'?'Belum Mulai':s==='On Progress'?'Dikerjakan':s}</span>
}
export function PriorityDot({p}) {
  const c = { Tinggi:'bg-rose-600', Sedang:'bg-amber-500', Rendah:'bg-zinc-400' }
  return <span className={'h-1.5 w-1.5 rounded-full '+(c[p]||'bg-zinc-400')} title={'Prioritas '+(p||'Sedang')}/>
}
export function taskPct(t) {
  if (!t) return 0
  if (t.status==='Done') return 100
  if (t.subtasks?.length) return Math.round(t.subtasks.filter(s=>s.done).length / t.subtasks.length * 100)
  if (t.status==='Review') return 75
  if (t.status==='On Progress') return 40
  return 0
}
const pct = t => taskPct(t)

export default function Dashboard() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [tick, setTick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>setDb(loadDB()),2500); return ()=>clearInterval(t) },[])
  if (!user) return null
  const team = db.teams.find(t=>t.id===user.teamId)
  const tasks = db.tasks.filter(t=>t.teamId===user.teamId)
  const mine = tasks.filter(t=>t.assignee===user.id)
  const today = new Date().toISOString().slice(0,10)
  const due = tasks.filter(t=>t.deadline && t.deadline<=today && t.status!=='Done')
  const upcoming = tasks.filter(t=>t.deadline && t.deadline>today && t.deadline<=new Date(Date.now()+7*864e5).toISOString().slice(0,10) && t.status!=='Done')
  const pinned = tasks.filter(t=>t.pinned && t.status!=='Done')
  const done = tasks.filter(t=>t.status==='Done').length
  const wsum = tasks.reduce((a,t)=>a+pct(t),0)
  const overall = tasks.length ? Math.round(wsum/tasks.length) : 0
  const dateStr = new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())
  const docs = (db.docs||[]).filter(d=>d.teamId===user.teamId)
  const polls = db.polls.filter(p=>p.teamId===user.teamId)
  const nameOf = id => db.users.find(u=>u.id===id)?.name || '—'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-5 dark:border-zinc-800">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-dim mb-1">{dateStr}</p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink dark:text-white">Fokus Pekerjaan & Pengingat Hari Ini</h1>
          <p className="mt-1 text-xs sm:text-sm text-inksoft dark:text-zinc-400">{team?.name} — semua tenggat, catatan rapat, dan keputusan tim tersusun rapi.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/proyek" className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-subtle dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 transition">
            <FolderKanban className="h-3.5 w-3.5 text-inksoft" strokeWidth={1.5}/>Proyek & Progres</Link>
          <Link to="/dokumen?new=1" className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-subtle dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 transition">
            <FileText className="h-3.5 w-3.5 text-inksoft" strokeWidth={1.5}/>Catatan Baru</Link>
        </div>
      </div>

      {/* Progress strip */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-inksoft" strokeWidth={1.5}/>
            <span className="text-xs font-semibold text-ink dark:text-white">Progres Penyelesaian Keseluruhan</span>
            <span className="text-[11px] text-dim">({done} dari {tasks.length} pekerjaan selesai)</span>
          </div>
          <span className="font-mono text-sm font-semibold text-ink dark:text-white">{overall}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
          <div className="h-full rounded-full bg-ink dark:bg-zinc-100 transition-all duration-300" style={{width:overall+'%'}}/>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-inksoft">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>Selesai: <strong className="font-mono text-ink dark:text-zinc-200">{done}</strong></span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-600"/>Berjalan: <strong className="font-mono text-ink dark:text-zinc-200">{tasks.filter(t=>t.status==='On Progress'||t.status==='Review').length}</strong></span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-zinc-400"/>Menunggu: <strong className="font-mono text-ink dark:text-zinc-200">{tasks.filter(t=>t.status==='To Do').length}</strong></span>
          </div>
          <Link to="/proyek" className="text-[11px] font-medium text-ink hover:underline dark:text-zinc-200">Lihat Progres per Proyek →</Link>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          { label:'Jatuh Tempo & Hari Ini', v:due.length, tone:'rose', link:'/tugas?view=focus', chip:'Perlu Segera' },
          { label:'Tenggat Mendatang', v:upcoming.length, tone:'amber', link:'/tugas?view=focus', chip:'Terjadwal' },
          { label:'Pengingat Disematkan', v:pinned.length, tone:'emerald', link:'/tugas?view=focus', chip:'Aktif' },
        ].map((c,i)=>(
          <Link key={i} to={c.link} className="group rounded-xl border border-line bg-white p-4 shadow-hairline hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-inksoft dark:text-zinc-400">{c.label}</span>
              <span className={'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium '+
                (c.tone==='rose'?'bg-rose-50 text-rose-700':c.tone==='amber'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700')}>
                <span className={'h-1.5 w-1.5 rounded-full '+(c.tone==='rose'?'bg-rose-600':c.tone==='amber'?'bg-amber-600':'bg-emerald-600')}/>{c.chip}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold text-ink dark:text-white">{c.v}</span>
              <span className="text-[11px] text-dim group-hover:text-ink transition flex items-center gap-1">Tinjau<ArrowRight className="h-3 w-3" strokeWidth={1.5}/></span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Priority reminders */}
        <Card className="lg:col-span-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-inksoft" strokeWidth={1.5}/>
              <h2 className="text-sm font-semibold text-ink dark:text-white">Pengingat & Tenggat Prioritas</h2>
            </div>
            <Link to="/tugas?new=1" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">+ Tambah Pengingat</Link>
          </div>
          <div className="divide-y divide-line dark:divide-zinc-800">
            {tasks.filter(t=>t.status!=='Done').sort((a,b)=>(a.deadline||'9999')<(b.deadline||'9999')?-1:1).slice(0,6).map(t=>(
              <Link to={'/tugas?open='+t.id} key={t.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-canvas dark:hover:bg-zinc-800/40 transition">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border '+(t.pinned?'border-indigo-300 bg-indigo-50':'border-zinc-300 dark:border-zinc-600')}>
                    {t.pinned && <Pin className="h-2.5 w-2.5 text-indigo-600" strokeWidth={2}/>}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-ink dark:text-zinc-100 truncate">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-inksoft">
                      <span className="rounded border border-line bg-subtle px-1.5 dark:border-zinc-700 dark:bg-zinc-800">{t.project||'Operasional'}</span>
                      <span className={'flex items-center gap-1 font-mono text-[10px] '+(t.deadline<=today?'text-rose-600':'text-inksoft')}>
                        <CalendarDays className="h-3 w-3" strokeWidth={1.5}/>{t.deadline||'—'}
                      </span>
                      <span className="text-dim">• PIC: <span className="text-inksoft dark:text-zinc-300">{nameOf(t.assignee)}</span></span>
                      {t.subtasks?.length>0 && <span className="font-mono text-[10px]">• {t.subtasks.filter(s=>s.done).length}/{t.subtasks.length} langkah</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span className="hidden sm:inline font-mono text-[11px] text-inksoft">{pct(t)}%</span>
                  <StatusPill s={t.status}/>
                </div>
              </Link>
            ))}
            {tasks.filter(t=>t.status!=='Done').length===0 && <p className="p-8 text-center text-xs text-dim">Semua pengingat prioritas telah selesai. 👍</p>}
          </div>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-inksoft dark:text-zinc-400">Catatan & Dokumen</h2>
              <Link to="/dokumen?new=1" className="text-[11px] font-medium text-ink hover:underline dark:text-zinc-200">+ Baru</Link>
            </div>
            <div className="space-y-2">
              {docs.slice(0,4).map(d=>(
                <Link key={d.id} to={'/dokumen?id='+d.id} className="flex w-full items-center justify-between rounded-lg border border-line bg-canvas p-2.5 text-left hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-7 w-7 place-items-center rounded-md border border-line bg-white text-inksoft dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <FileText className="h-3.5 w-3.5" strokeWidth={1.5}/>
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-ink dark:text-zinc-100 truncate">{d.title}</p>
                      <p className="text-[10px] text-dim">{d.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-dim shrink-0" strokeWidth={1.5}/>
                </Link>
              ))}
              {docs.length===0 && <p className="py-3 text-center text-[11px] text-dim">Belum ada dokumen.</p>}
            </div>
          </Card>

          {polls.length>0 && (() => { const p = polls[polls.length-1]; const total = Object.keys(p.votes||{}).length; return (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink dark:text-white"><Vote className="h-3.5 w-3.5 text-inksoft" strokeWidth={1.5}/>Keputusan Tim</span>
                <Link to="/voting" className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400">Semua</Link>
              </div>
              <p className="text-xs font-medium text-ink dark:text-zinc-100 leading-snug mb-3">{p.q}</p>
              <div className="space-y-1.5">
                {p.options.map((o,i)=>{ const count = Object.values(p.votes||{}).filter(v=>v===i).length
                  const pc = total?Math.round(count/total*100):0
                  return <Link key={i} to="/voting" className="relative block w-full overflow-hidden rounded-lg border border-line bg-canvas px-3 py-2 text-left text-[11px] hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="absolute inset-y-0 left-0 bg-indigo-500/10" style={{width:pc+'%'}}/>
                    <div className="relative flex items-center justify-between gap-2">
                      <span className="font-medium text-ink dark:text-zinc-200 truncate">{o}</span>
                      <span className="font-mono text-[10px] text-inksoft">{pc}%</span>
                    </div></Link> })}
              </div>
            </Card>
          )})()}
        </div>
      </div>
    </div>
  )
}
