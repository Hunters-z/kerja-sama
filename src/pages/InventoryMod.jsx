import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '@/lib/db.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card } from '@/components/ui/card.jsx'

export default function InventoryMod() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [form, setForm] = useState({name:'', qty:''})
  const items = db.inventory.filter(i=>i.teamId===user.teamId)
  const add = e => {
    e.preventDefault()
    const next = {...db, inventory:[...db.inventory, {id:'i'+Date.now(), teamId:user.teamId, ...form, qty:+form.qty}]}
    saveDB(next); setDb(next); setForm({name:'', qty:''})
  }
  const adj = (id, d) => { const next={...db, inventory:db.inventory.map(i=>i.id===id?{...i,qty:Math.max(0,i.qty+d)}:i)}; saveDB(next); setDb(next) }
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">📦 Inventori Lapangan</h1>
      <form onSubmit={add} className="card p-5 mb-4 flex flex-wrap gap-2.5 items-end">
        <div className="flex flex-col gap-1"><Label>Barang</Label>
          <Input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-56" placeholder="mis. Drone, GPS, Tenda"/></div>
        <div className="flex flex-col gap-1"><Label>Jumlah</Label>
          <Input required type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} className="w-24"/></div>
        <Button type="submit">Tambah</Button>
      </form>
      <Card className="p-5">
        {items.length===0 && <p className="text-inksoft text-[13px]">Belum ada barang tercatat.</p>}
        {items.map(i=>(
          <div key={i.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]">
            <b>{i.name}</b>
            <div className="ml-auto flex items-center gap-2">
              <Button onClick={()=>adj(i.id,-1)} variant="outline" size="icon" className="w-7 h-7 rounded-lg">−</Button>
              <b className="w-10 text-center">{i.qty}</b>
              <Button onClick={()=>adj(i.id,1)} size="icon" className="w-7 h-7 rounded-lg bg-blue-soft text-blue-dark hover:bg-blue hover:text-white shadow-none">+</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
