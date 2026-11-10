import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '@/lib/db.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card } from '@/components/ui/card.jsx'

export default function ExpensesMod() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [form, setForm] = useState({desc:'', amount:''})
  const items = db.expenses.filter(x=>x.teamId===user.teamId)
  const total = items.reduce((s,x)=>s+x.amount,0)
  const add = e => {
    e.preventDefault()
    const next = {...db, expenses:[{id:'x'+Date.now(), teamId:user.teamId, userId:user.id, ...form, amount:+form.amount, at:new Date().toISOString()}, ...db.expenses]}
    saveDB(next); setDb(next); setForm({desc:'', amount:''})
  }
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">💸 Pengeluaran Tim</h1>
      <form onSubmit={add} className="card p-5 mb-4 flex flex-wrap gap-2.5 items-end">
        <div className="flex flex-col gap-1"><Label>Keterangan</Label>
          <Input required value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} className="w-56" placeholder="mis. BBM survey"/></div>
        <div className="flex flex-col gap-1"><Label>Jumlah (Rp)</Label>
          <Input required type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-32"/></div>
        <Button type="submit">Catat</Button>
      </form>
      <Card className="p-5">
        <div className="flex justify-between font-disp font-extrabold mb-2"><span>Total</span><span className="text-red">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(total)}</span></div>
        {items.map(x=>(
          <div key={x.id} className="flex gap-2.5 py-2 text-[13.5px] border-b border-line last:border-0">
            <b>{x.desc}</b><span className="text-[11.5px] text-inksoft">{db.users.find(u=>u.id===x.userId)?.name}</span>
            <b className="ml-auto text-red">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(x.amount)}</b>
          </div>
        ))}
        {items.length===0 && <p className="text-inksoft text-[13px]">Belum ada pengeluaran.</p>}
      </Card>
    </div>
  )
}
