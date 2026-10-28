import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'
import { StatusPill } from './Dashboard.jsx'

const COLS = ['To Do','On Progress','Done']
export default function Tasks() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [form, setForm] = useState({title:'', assignee:'', deadline:''})
  const team = db.teams.find(t=>t.id===user.teamId)
  const members = db.users.filter(u=>u.teamId===user.teamId && u.status==='active')
  const move = (id, status) => { const next={...db, tasks:db.tasks.map(t=>t.id===id?{...t,status}:t)}; saveDB(next); setDb(next) }
  const add = e => {
    e.preventDefault()
    const next = {...db, tasks:[...db.tasks, {id:'t'+Date.now(), teamId:user.teamId, ...form, assignee:form.assignee||user.id, status:'To Do', note:''}]}
    saveDB(next); setDb(next); setForm({title:'', assignee:'', deadline:''})
  }
  const del = id => { const next={...db, tasks:db.tasks.filter(t=>t.id!==id)}; saveDB(next); setDb(next) }
  const today = new Date().toISOString().slice(0,10)
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Tugas</h1>
      <div className="grid md:grid-cols-3 gap-3.5">
        {COLS.map(col=>(
          <div key={col} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-disp font-bold text-[13.5px]">{col}</h3>
              <span className="pill bg-line text-inksoft ml-auto">{db.tasks.filter(t=>t.teamId===user.teamId && t.status===col).length}</span>
            </div>
            {db.tasks.filter(t=>t.teamId===user.teamId && t.status===col).map(t=>(
              <div key={t.id} className="bg-paper border border-line rounded-xl p-3 mb-2">
                <b className="text-[13px]">{t.title}</b>
                <div className="text-[11.5px] text-inksoft mt-1">{db.users.find(u=>u.id===t.assignee)?.name} · {t.deadline<=today && t.status!=='Done' ? <span className="text-red font-bold">⏰ {t.deadline}</span> : t.deadline}</div>
                <div className="flex gap-1.5 mt-2">
                  {COLS.filter(c=>c!==col).map(c=>(
                    <button key={c} onClick={()=>move(t.id,c)} className="pill bg-white border border-line hover:border-blue text-[10px]">→ {c}</button>
                  ))}
                  {user.role==='admin' && <button onClick={()=>del(t.id)} className="pill bg-red-soft text-red text-[10px] ml-auto">Hapus</button>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={add} className="card p-5 mt-4 flex flex-wrap gap-2.5 items-end">
        <label className="flex flex-col gap-1 text-[11.5px] font-bold text-inksoft">Tugas baru
          <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] w-56" placeholder="Judul tugas"/></label>
        <label className="flex flex-col gap-1 text-[11.5px] font-bold text-inksoft">Penanggung jawab
          <select value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} className="border border-line rounded-xl px-3 py-2.5 text-[13px] bg-white">
            <option value="">Saya</option>
            {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select></label>
        <label className="flex flex-col gap-1 text-[11.5px] font-bold text-inksoft">Deadline
          <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="border border-line rounded-xl px-3 py-2.5 text-[13px]"/></label>
        <button className="btn-blue px-5 py-2.5 text-[13px]">Tambah</button>
      </form>
    </div>
  )
}