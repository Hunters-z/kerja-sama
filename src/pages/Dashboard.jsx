import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadDB, currentUser } from '@/lib/db.js'
import { Card } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'

export default function Dashboard() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  if (!user) return null
  const team = db.teams.find(t=>t.id===user.teamId)
  const tasks = db.tasks.filter(t=>t.teamId===user.teamId)
  const mine = tasks.filter(t=>t.assignee===user.id)
  const today = new Date().toISOString().slice(0,10)
  const due = tasks.filter(t=>t.deadline<=today && t.status!=='Done')
  const done = tasks.filter(t=>t.status==='Done').length
  return (
    <div className="p-4 md:p-7 max-w-5xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-1">Beranda</h1>
      <p className="text-inksoft text-[13px] mb-5">{team?.name} · {tasks.length} tugas aktif</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon="✅" tone="default" label="Tugas saya" v={mine.length}/>
        <Stat icon="⏰" tone="destructive" label="Deadline ≤ hari ini" v={due.length}/>
        <Stat icon="🏁" tone="success" label="Selesai" v={done}/>
        <Stat icon="👥" tone="violet" label="Anggota tim" v={db.users.filter(u=>u.teamId===user.teamId && u.status==='active').length}/>
      </div>
      <Card className="p-5">
        <h3 className="font-disp font-bold text-[14.5px] mb-3">Tugas terbaru</h3>
        {tasks.slice(0,5).map(t=>(
          <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]">
            <b>{t.title}</b>
            <span className="text-[11.5px] text-inksoft">{db.users.find(u=>u.id===t.assignee)?.name}</span>
            <span className="ml-auto text-[11.5px] text-inksoft">⏰ {t.deadline}</span>
            <StatusPill s={t.status}/>
          </div>
        ))}
        <Link to="/tugas" className="inline-block mt-3 text-[13px] font-bold text-blue hover:text-blue-dark">Lihat semua tugas →</Link>
      </Card>
    </div>
  )
}
export function Stat({icon,tone,label,v}) {
  const tones = { default:'bg-blue-soft text-blue-dark', destructive:'bg-red-soft text-red', success:'bg-green-soft text-emerald-700', violet:'bg-violet-soft text-violet' }
  return (
    <Card className="p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center text-base ${tones[tone]}`}>{icon}</div>
      <div className="font-disp text-xl font-extrabold mt-2">{v}</div>
      <div className="text-[11.5px] text-inksoft">{label}</div>
    </Card>
  )
}
export function StatusPill({s}) {
  const map = {'To Do':'secondary','On Progress':'warning','Done':'success'}
  return <Badge variant={map[s] || 'secondary'}>{s}</Badge>
}
