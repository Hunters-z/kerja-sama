import { useState } from 'react'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { CalendarClock, Copy, Plus, Trash2, LayoutGrid } from 'lucide-react'

export default function Extras() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [tab, setTab] = useState('calendar')
  const persist = next => { saveDB(next); setDb(next) }
  const log = (next, action, icon) => logAct(next, {name:user.name, teamId:user.teamId}, action, icon)

  const tasks = db.tasks.filter(t=>t.teamId===user.teamId)
  const today = new Date().toISOString().slice(0,10)
  const fmt = iso => new Intl.DateTimeFormat('id-ID',{weekday:'short',day:'numeric',month:'short'}).format(new Date(iso))
  const roadmap = [
    { period:'Hari Ini & Prioritas', tag:'Fokus Utama',
      entries: tasks.filter(t=>t.deadline===today && t.status!=='Done').map(t=>`${t.title} · PIC ${db.users.find(u=>u.id===t.assignee)?.name||'—'}`) },
    { period:'Minggu Ini', tag:'Terjadwal',
      entries: tasks.filter(t=>t.deadline>today && t.deadline<=new Date(Date.now()+7*864e5).toISOString().slice(0,10) && t.status!=='Done').map(t=>`${fmt(t.deadline)} — ${t.title}`) },
    { period:'Mendatang & Tanpa Tenggat', tag:'Perencanaan',
      entries: tasks.filter(t=>!t.deadline || t.deadline>new Date(Date.now()+7*864e5).toISOString().slice(0,10)).filter(t=>t.status!=='Done').map(t=>t.title) },
  ]

  const snippets = (db.snippets||[]).filter(s=>s.teamId===user.teamId)
  const addSnippet = () => { const next={...db, snippets:[...(db.snippets||[]), { id:'s'+Date.now(), teamId:user.teamId, title:'Catatan Baru', content:'' }]}; log(next,'menambahkan snippet','sticky-note'); persist(next) }
  const delSnippet = s => { const next={...db, snippets:(db.snippets||[]).filter(x=>x.id!==s.id)}; persist(next) }
  const copy = async s => { try { await navigator.clipboard.writeText(s.content) } catch {} }

  const activity = (db.activity||[]).filter(a=>a.teamId===user.teamId).slice(0,40)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-ink dark:text-white">Kalender Tenggat, Snippets & Riwayat</h1>
          <p className="text-xs text-inksoft mt-0.5">Referensi cepat tenggat tim, catatan tempel, dan log aktivitas pekerjaan.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-subtle p-0.5 dark:border-zinc-800 dark:bg-zinc-950 self-start sm:self-auto">
          {[['calendar','Kalender'],['snippets','Snippets'],['activity','Riwayat']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} className={'rounded-md px-2.5 py-1.5 text-xs font-medium transition '+(tab===k?'bg-white text-ink shadow-hairline dark:bg-zinc-800 dark:text-white':'text-inksoft')}>{l}</button>
          ))}
        </div>
      </div>

      {tab==='calendar' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roadmap.map(slot=>(
          <div key={slot.period} className="rounded-xl border border-line bg-white p-4 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3 dark:border-zinc-800">
              <span className="text-xs font-semibold text-ink dark:text-white">{slot.period}</span>
              <span className="font-mono text-[10px] text-dim">{slot.tag}</span>
            </div>
            <ul className="space-y-2.5 text-xs text-inksoft dark:text-zinc-300">
              {slot.entries.map((e,i)=><li key={i} className="flex items-start gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-dim mt-0.5 shrink-0" strokeWidth={1.5}/><span>{e}</span></li>)}
              {slot.entries.length===0 && <li className="text-dim">Tidak ada tenggat.</li>}
            </ul>
          </div>
        ))}
      </div>}

      {tab==='snippets' && <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Catatan Tempel & Template Salin Cepat</span>
          <button onClick={addSnippet} className="text-xs font-medium text-ink hover:underline dark:text-zinc-200">+ Tambah Snippet</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {snippets.map(s=>(
            <div key={s.id} className="rounded-xl border border-line bg-white p-4 shadow-hairline space-y-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <input value={s.title} onChange={e=>persist({...db, snippets:(db.snippets||[]).map(x=>x.id===s.id?{...x,title:e.target.value}:x)})}
                  className="w-full bg-transparent text-xs font-semibold text-ink focus:outline-none dark:text-white"/>
                <div className="flex items-center gap-1">
                  <button onClick={()=>copy(s)} title="Salin" className="rounded-md border border-line p-1.5 text-inksoft hover:text-ink"><Copy className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                  <button onClick={()=>delSnippet(s)} className="rounded-md p-1.5 text-dim hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5}/></button>
                </div>
              </div>
              <textarea value={s.content} onChange={e=>persist({...db, snippets:(db.snippets||[]).map(x=>x.id===s.id?{...x,content:e.target.value}:x)})}
                rows={3} className="w-full resize-none bg-transparent font-mono text-[11px] leading-relaxed text-inksoft focus:outline-none dark:text-zinc-300"/>
            </div>
          ))}
          {snippets.length===0 && <div className="md:col-span-2 rounded-xl border border-dashed border-line p-8 text-center text-xs text-dim">
            <LayoutGrid className="h-5 w-5 mx-auto mb-2" strokeWidth={1.5}/>Belum ada snippet.</div>}
        </div>
      </div>}

      {tab==='activity' && <div className="rounded-xl border border-line bg-white p-5 shadow-hairline dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-3">
          {activity.map(a=>(
            <div key={a.id} className="flex items-start gap-3 border-b border-line pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line bg-canvas text-inksoft dark:border-zinc-700 dark:bg-zinc-800">
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink dark:text-zinc-200"><strong className="font-semibold">{a.actor}</strong>{' '}{a.action}</p>
                <span className="font-mono text-[10px] text-dim">{new Date(a.at).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
          {activity.length===0 && <p className="py-6 text-center text-xs text-dim">Belum ada aktivitas tercatat.</p>}
        </div>
      </div>}
    </div>
  )
}
