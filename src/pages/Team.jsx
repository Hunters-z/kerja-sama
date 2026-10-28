import { useEffect, useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'
import { webauthnSupported, enroll } from '../lib/webauthn.js'

export default function Team() {
  const [db, setDb] = useState(loadDB())
  const [msg, setMsg] = useState('')
  const user = currentUser()
  const team = db.teams.find(t=>t.id===user.teamId)
  const members = db.users.filter(u=>u.teamId===user.teamId)
  const refresh = next => { saveDB(next); setDb({...next}) }
  const approve = id => refresh({...db, users:db.users.map(u=>u.id===id?{...u,status:'active'}:u)})
  const reject = id => refresh({...db, users:db.users.filter(u=>u.id!==id)})
  const doEnroll = async () => {
    try {
      const credId = await enroll(user)
      refresh({...db, users:db.users.map(u=>u.id===user.id?{...u,credId}:u)})
      setMsg('✓ Fingerprint terdaftar — gunakan untuk login cepat')
    } catch(e) { setMsg(e.name==='NotAllowedError' ? 'Pendaftaran dibatalkan' : 'Gagal: '+(e.message||e.name)) }
    setTimeout(()=>setMsg(''),4000)
  }
  const regenTeamId = () => refresh({...db, teams:db.teams.map(t=>t.id===user.teamId?{...t, id:'T-'+Math.random().toString(36).slice(2,7).toUpperCase()}:t)})
  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Tim</h1>
      {msg && <div className="card p-3.5 mb-4 text-[13px] font-bold">{msg}</div>}
      <div className="card p-5 mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-[11.5px] font-bold text-inksoft uppercase">ID Tim (bagikan ke anggota)</div>
          <div className="font-disp text-2xl font-extrabold text-blue tracking-wider">{team?.id}</div>
        </div>
        {user.role==='admin' && <button onClick={regenTeamId} className="pill bg-line text-inksoft hover:bg-blue-soft hover:text-blue-dark ml-auto font-bold">Regenerate ID</button>}
      </div>
      <div className="card p-5">
        <h3 className="font-disp font-bold text-[14px] mb-3">Anggota ({members.filter(m=>m.status==='active').length} aktif)</h3>
        {members.map(m=>(
          <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue to-violet text-white grid place-items-center text-[11px] font-bold">{m.name.slice(0,2).toUpperCase()}</div>
            <div><b>{m.name}</b><div className="text-[11.5px] text-inksoft">@{m.username} · {m.role}</div></div>
            <div className="ml-auto flex gap-2">
              {m.status==='pending' ? <>
                <span className="pill bg-amber-soft text-amber-700">Pending</span>
                {user.role==='admin' && <>
                  <button onClick={()=>approve(m.id)} className="pill bg-green-soft text-emerald-700 font-bold">Setujui</button>
                  <button onClick={()=>reject(m.id)} className="pill bg-red-soft text-red font-bold">Tolak</button>
                </>}
              </> : <>
                {m.credId && <span className="pill bg-blue-soft text-blue-dark">👆 Fingerprint</span>}
                <span className="pill bg-green-soft text-emerald-700">Aktif</span>
              </>}
            </div>
          </div>
        ))}
      </div>
      {webauthnSupported() && (
        <button onClick={doEnroll} className="btn-blue w-full py-3 mt-4">👆 Daftarkan fingerprint untuk akun ini</button>
      )}
    </div>
  )
}