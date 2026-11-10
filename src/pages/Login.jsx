import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, loadDB, saveDB } from '@/lib/db.js'
import { webauthnSupported, enroll, verify } from '@/lib/webauthn.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'

export default function Login() {
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
          <Card title="Review laporan mingguan" badge="On Progress" tone="warning"/>
          <Card title="Sinkronisasi tim selesai" badge="Done" tone="success"/>
          <Card title="Deadline tugas lapangan" badge="Hari ini" tone="destructive"/>
        </div>
      </div>
      {/* Panel kanan: form */}
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="font-disp font-extrabold text-xl mb-4 lg:hidden">Kerja<span className="text-blue">Sama</span></div>
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="login" className="flex-1" onClick={()=>setErr('')}>Masuk</TabsTrigger>
              <TabsTrigger value="daftar" className="flex-1" onClick={()=>setErr('')}>Daftar</TabsTrigger>
            </TabsList>
            {err && <div className="mb-4 text-[13px] font-bold text-red bg-red-soft p-3 rounded-xl">{err}</div>}
            <TabsContent value="login">
              <form onSubmit={doLogin} className="space-y-3">
                <Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
                <Field label="Password" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/>
                <Button type="submit" className="w-full h-12">Masuk →</Button>
              </form>
            </TabsContent>
            <TabsContent value="daftar">
              <form onSubmit={doRegister} className="space-y-3">
                <Field label="Nama lengkap" value={form.name} onChange={v=>setForm({...form,name:v})}/>
                <Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
                <Field label="Password" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/>
                <Field label="ID Tim (kosongkan = buat tim baru)" value={form.teamId} onChange={v=>setForm({...form,teamId:v})}/>
                <Button type="submit" className="w-full h-12">Daftar →</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="flex items-center gap-3 text-[11px] text-inksoft my-4"><div className="flex-1 border-t border-line"/>atau<div className="flex-1 border-t border-line"/></div>
          {webauthnSupported() && <>
            <Button onClick={fpLogin} variant="outline" className="w-full h-12">👆 Masuk dengan Fingerprint</Button>
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
    <Badge variant={tone} className="ml-auto">{badge}</Badge>
  </div>
}
export function Field({label,type='text',value,onChange}) {
  return <label className="block">
    <Label className="block uppercase tracking-wide">{label}</Label>
    <Input type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 h-11 text-[14px]"/>
  </label>
}
