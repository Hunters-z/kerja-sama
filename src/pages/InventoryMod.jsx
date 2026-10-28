import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'

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
        <label className="flex flex-col gap-1 text-[11.5px] font-bold text-inksoft">Barang
          <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] w-56" placeholder="mis. Drone, GPS, Tenda"/></label>
        <label className="flex flex-col gap-1 text-[11.5px] font-bold text-inksoft">Jumlah
          <input required type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} className="border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] w-24"/></label>
        <button className="btn-blue px-5 py-2.5 text-[13px]">Tambah</button>
      </form>
      <div className="card p-5">
        {items.length===0 && <p className="text-inksoft text-[13px]">Belum ada barang tercatat.</p>}
        {items.map(i=>(
          <div key={i.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]">
            <b>{i.name}</b>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={()=>adj(i.id,-1)} className="w-7 h-7 rounded-lg bg-paper font-bold">−</button>
              <b className="w-10 text-center">{i.qty}</b>
              <button onClick={()=>adj(i.id,1)} className="w-7 h-7 rounded-lg bg-blue-soft text-blue-dark font-bold">+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}