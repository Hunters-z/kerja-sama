import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'

export default function Announcements() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [text, setText] = useState('')
  const teamAnn = db.announcements.filter(a=>a.teamId===user.teamId)
  const post = e => {
    e.preventDefault()
    const next = {...db, announcements:[{id:'a'+Date.now(), teamId:user.teamId, by:user.name, text, at:new Date().toISOString()}, ...db.announcements]}
    saveDB(next); setDb(next); setText('')
  }
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">📣 Pengumuman</h1>
      {user.role==='admin' && (
        <form onSubmit={post} className="card p-5 mb-4 flex gap-2.5">
          <input required value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis pengumuman untuk tim…"
            className="flex-1 border border-line rounded-xl px-3.5 py-2.5 text-[14px]"/>
          <button className="btn-blue px-5 text-[13px]">Kirim</button>
        </form>
      )}
      {teamAnn.length===0 && <p className="text-inksoft text-[13px]">Belum ada pengumuman.</p>}
      {teamAnn.map(a=>(
        <div key={a.id} className="card p-4.5 p-5 mb-3 flex gap-3">
          <span className="text-xl">📣</span>
          <div><b className="text-[13.5px]">{a.by}</b> <span className="text-[11.5px] text-inksoft">· {new Date(a.at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
          <p className="text-[13.5px] mt-1">{a.text}</p></div>
        </div>
      ))}
    </div>
  )
}