import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '@/lib/db.js'
import { StatusPill } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx'
import { Card } from '@/components/ui/card.jsx'

const COLS = ['To Do','On Progress','Done']
export default function Tasks() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [form, setForm] = useState({title:'', assignee:'', deadline:''})
  const members = db.users.filter(u=>u.teamId===user.teamId && u.status==='active')
  const move = (id, status) => { const next={...db, tasks:db.tasks.map(t=>t.id===id?{...t,status}:t)}; saveDB(next); setDb(next) }
  const add = e => {
    e.preventDefault()
    const next = {...db, tasks:[...db.tasks, {id:'t'+Date.now(), teamId:user.teamId, ...form, assignee:(form.assignee && form.assignee!=='saya')?form.assignee:(form.assignee||user.id), status:'To Do', note:''}]}
    saveDB(next); setDb(next); setForm({title:'', assignee:'', deadline:''})
  }
  const del = id => { const next={...db, tasks:db.tasks.filter(t=>t.id!==id)}; saveDB(next); setDb(next) }
  const today = new Date().toISOString().slice(0,10)
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Tugas</h1>
      <div className="grid md:grid-cols-3 gap-3.5">
        {COLS.map(col=>(
          <Card key={col} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-disp font-bold text-[13.5px]">{col}</h3>
              <Badge variant="secondary" className="ml-auto">{db.tasks.filter(t=>t.teamId===user.teamId && t.status===col).length}</Badge>
            </div>
            {db.tasks.filter(t=>t.teamId===user.teamId && t.status===col).map(t=>(
              <div key={t.id} className="bg-card2/60 border border-line rounded-xl p-3 mb-2">
                <b className="text-[13px]">{t.title}</b>
                <div className="text-[11.5px] text-inksoft mt-1">{db.users.find(u=>u.id===t.assignee)?.name} · {t.deadline<=today && t.status!=='Done' ? <span className="text-red font-bold">⏰ {t.deadline}</span> : t.deadline}</div>
                <div className="flex gap-1.5 mt-2">
                  {COLS.filter(c=>c!==col).map(c=>(
                    <Button key={c} onClick={()=>move(t.id,c)} variant="outline" className="rounded-full h-6 px-2.5 text-[10px]">→ {c}</Button>
                  ))}
                  {user.role==='admin' && <Button onClick={()=>del(t.id)} className="rounded-full h-6 px-2.5 text-[10px] ml-auto bg-red-soft text-red hover:bg-red hover:text-white shadow-none">Hapus</Button>}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <form onSubmit={add} className="card p-5 mt-4 flex flex-wrap gap-2.5 items-end">
        <div className="flex flex-col gap-1"><Label>Tugas baru</Label>
          <Input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-56" placeholder="Judul tugas"/></div>
        <div className="flex flex-col gap-1"><Label>Penanggung jawab</Label>
          <Select value={form.assignee || 'saya'} onValueChange={v=>setForm({...form,assignee:v==='saya'?'':v})}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="saya">Saya</SelectItem>
              {members.map(m=><SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select></div>
        <div className="flex flex-col gap-1"><Label>Deadline</Label>
          <Input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></div>
        <Button type="submit">Tambah</Button>
      </form>
    </div>
  )
}
