import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'

export default function AttendanceMod() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const today = new Date().toDateString()
  const mine = db.attendance.find(a=>a.userId===user.id && new Date(a.in).toDateString()===today)
  const mark = () => {
    const now = Date.now()
    let next
    if (!mine) {
      next = {...db, attendance:[...db.attendance, {userId:user.id, in:now, out:null}]}
    } else if (!mine.out) {
      next = {...db, attendance:db.attendance.map(a=>a===mine?{...a,out:now}:a)}
    } else return
    saveDB(next); setDb(next)
  }
  const todayAll = db.attendance.filter(a=>new Date(a.in).toDateString()===today)
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">⏰ Absen Hadir</h1>
      <div className="card p-6 text-center mb-4">
        <div className="text-inksoft text-[13px]">{mine ? (mine.out ? 'Absensi hari ini lengkap ✓' : `Masuk ${new Date(mine.in).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} — tinggal absen pulang`) : 'Belum absen hari ini'}</div>
        <button onClick={mark} disabled={mine&&mine.out} className="btn-blue w-full py-3.5 mt-3 text-[14px] disabled:opacity-40">
          {mine ? (mine.out ? 'Selesai' : 'Absen Pulang') : 'Absen Masuk'}
        </button>
      </div>
      <div className="card p-5">
        <h3 className="font-disp font-bold text-[14px] mb-2">Hadir hari ini ({todayAll.length})</h3>
        {todayAll.map(a=>(
          <div key={a.userId} className="flex gap-2.5 py-2 text-[13.5px] border-b border-line last:border-0">
            <b>{db.users.find(u=>u.id===a.userId)?.name}</b>
            <span className="ml-auto text-inksoft text-[12px]">masuk {new Date(a.in).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{a.out && ` · pulang ${new Date(a.out).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`}</span>
          </div>
        ))}
        {todayAll.length===0 && <p className="text-inksoft text-[13px]">Belum ada yang absen.</p>}
      </div>
    </div>
  )
}