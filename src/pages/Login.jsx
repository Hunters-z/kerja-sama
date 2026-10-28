import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, loadDB, saveDB } from '../lib/db.js'
import { webauthnSupported, enroll, verify } from '../lib/webauthn.js'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({username:'', password:'', name:'', teamId:''})
  const [err, setErr] = useState('')
  const [fpMsg, setFpMsg] = useState('')
  const nav = useNavigate()
  const go = () => nav('/')

  const doLogin = e => {
    e.preventDefault()
    const r = login(form.username, form.password)
    r.error ? setErr(r.error) : go()
  }
  const doRegister = e => {
    e.preventDefault()
    if (!form.name || !form.username || !form.password) return setErr('Lengkapi semua kolom')
    const r = register(form)
    r.error ? setErr(r.error) : go()
  }
  const fpLogin = async () => {
    setFpMsg(''); setErr('')
    try {
      await verify()
      const db = loadDB()
      const u = db.users.find(x=>x.id===db.session) || db.users.find(x=>x.credId)
      if (!u) return setErr('Belum ada akun terdaftar fingerprint di perangkat ini')
      db.session = u.id; saveDB(db); go()
    } catch(e) { setFpMsg(e.name==='NotAllowedError' ? 'Verifikasi dibatalkan' : 'Fingerprint gagal: '+(e.message||e.name)) }
  }
  const fpEnroll = async () => {
    setFpMsg(''); setErr('')
    try {
      const db = loadDB()
      const u = db.users.find(x=>x.id===db.session)
      if (!u) return setErr('Masuk dulu dengan password, lalu daftarkan fingerprint dari halaman Tim')
      const credId = await enroll(u)
      u.credId = credId; saveDB(db); setFpMsg('✓ Fingerprint terdaftar! Gunakan untuk login berikutnya.')
    } catch(e) { setFpMsg(e.name==='NotAllowedError' ? 'Pendaftaran dibatalkan' : 'Gagal: '+(e.message||e.name)) }
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Panel kiri: showcase */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue to-violet text-white p-10">
        <div className="font-disp font-extrabold text-2xl">Kerja<span className="text-white/70">Sama</span></div>
        <div>
          <h1 className="font-disp text-4xl font-extrabold leading-tight">Kelola tim lapangan<br/>tanpa ribet.</h1>
          <p className="text-white/80 mt-4 max-w-md">Tugas harian, deadline, dan laporan lapangan — semua tersinkron dalam satu tempat. Dibuat untuk mandor, surveior, dan tim lapangan Indonesia.</p>
        </div>
        <div className="space-y-3">
          <Card title="Review laporan mingguan" badge="On Progress" tone="bg-amber-soft text-amber-700"/>
          <Card title="Sinkronisasi tim selesai" badge="Done" tone="bg-green-soft text-emerald-700"/>
          <Card title="Deadline tugas lapangan" badge="Hari ini" tone="bg-red-soft text-red"/>
        </div>
      </div>
      {/* Panel kanan: form */}
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="font-disp font-extrabold text-xl mb-1 lg:hidden">Kerja<span className="text-blue">Sama</span></div>
          <div className="flex gap-1 bg-line/60 p-1 rounded-xl mb-5">
            {['login','daftar'].map(t=>(
              <button key={t} onClick={()=>{setTab(t); setErr('')}} className={'flex-1 py-2 rounded-lg text-[13px] font-bold transition '+(tab===t?'bg-white shadow-soft text-ink':'text-inksoft')}>{t==='login'?'Masuk':'Daftar'}</button>
            ))}
          </div>
          {err && <div className="mb-4 text-[13px] font-bold text-red bg-red-soft p-3 rounded-xl">{err}</div>}
          {tab==='login' ? (
            <form onSubmit={doLogin} className="space-y-3">
              <Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
              <Field label="Password" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/>
              <button className="btn-blue w-full py-3">Masuk →</button>
            </form>
          ) : (
            <form onSubmit={doRegister} className="space-y-3">
              <Field label="Nama lengkap" value={form.name} onChange={v=>setForm({...form,name:v})}/>
              <Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
              <Field label="Password" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/>
              <Field label="ID Tim (kosongkan = buat tim baru)" value={form.teamId} onChange={v=>setForm({...form,teamId:v})}/>
              <button className="btn-blue w-full py-3">Daftar →</button>
            </form>
          )}
          <div className="flex items-center gap-3 text-[11px] text-inksoft my-4"><div className="flex-1 border-t border-line"/>atau<div className="flex-1 border-t border-line"/></div>
          {webauthnSupported() && <>
            <button onClick={fpLogin} className="w-full card py-3 font-bold text-[14px] hover:border-blue transition">👆 Masuk dengan Fingerprint</button>
            <button onClick={fpEnroll} className="w-full mt-2 text-[12px] text-inksoft hover:text-blue font-semibold py-1">Daftarkan fingerprint di perangkat ini</button>
            {fpMsg && <p className="text-[12px] text-center mt-2 font-semibold text-blue-dark">{fpMsg}</p>}
          </>}
          <div className="mt-6 card p-3.5 text-[12px] text-inksoft">
            Mode demo — akun tersedia: <b className="text-ink">admin / admin123</b> (admin) · <b className="text-ink">budi / budi123</b> (anggota)
          </div>
          <p className="text-center text-[11px] text-inksoft mt-5">v1.0.0 · dibuat ulang dengan React</p>
        </div>
      </div>
    </div>
  )
}
function Card({title,badge,tone}) {
  return <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-white/20"/>
    <div className="font-semibold text-[14px]">{title}</div>
    <span className={'ml-auto pill '+tone}>{badge}</span>
  </div>
}
export function Field({label,type='text',value,onChange}) {
  return <label className="block">
    <span className="text-[11.5px] font-bold text-inksoft uppercase tracking-wide">{label}</span>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full border border-line rounded-xl px-3.5 py-2.5 mt-1 text-[14px] focus:border-blue outline-none bg-white"/>
  </label>
}