import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'

export default function Reports() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [form, setForm] = useState({title:'', body:''})
  const teamReports = db.reports.filter(r=>r.teamId===user.teamId)
  const add = e => {
    e.preventDefault()
    const next = {...db, reports:[{id:'r'+Date.now(), teamId:user.teamId, userId:user.id, ...form, at:new Date().toISOString()}, ...db.reports]}
    saveDB(next); setDb(next); setForm({title:'', body:''})
  }
  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Laporan</h1>
      <form onSubmit={add} className="card p-5 mb-4">
        <h3 className="font-disp font-bold text-[14px] mb-3">Tulis laporan lapangan</h3>
        <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Judul laporan"
          className="w-full border border-line rounded-xl px-3.5 py-2.5 text-[14px] mb-2.5"/>
        <textarea required value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Isi laporan: progress, kendala, hasil…"
          rows={4} className="w-full border border-line rounded-xl px-3.5 py-2.5 text-[14px]"/>
        <button className="btn-blue px-5 py-2.5 text-[13px] mt-3">Kirim laporan</button>
      </form>
      {teamReports.length===0 && <p className="text-inksoft text-[13px]">Belum ada laporan.</p>}
      {teamReports.map(r=>(
        <div key={r.id} className="card p-5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-violet text-white grid place-items-center text-[10px] font-bold">{db.users.find(u=>u.id===r.userId)?.name.slice(0,2).toUpperCase()}</div>
            <b className="text-[14px]">{r.title}</b>
            <span className="ml-auto text-[11.5px] text-inksoft">{new Date(r.at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <p className="text-[13.5px] text-inksoft mt-2.5 whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}
    </div>
  )
}