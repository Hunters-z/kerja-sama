import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '../lib/db.js'

const CATALOG = [
  { key:'announcements', icon:'📣', name:'Pengumuman', desc:'Admin kirim pengumuman ke seluruh tim' },
  { key:'attendance', icon:'⏰', name:'Absen Hadir', desc:'Anggota absen masuk/pulang dengan waktu tercatat' },
  { key:'inventory', icon:'📦', name:'Inventori Lapangan', desc:'Catat peralatan & stok barang tim' },
  { key:'expenses', icon:'💸', name:'Pengeluaran Tim', desc:'Catat biaya operasional lapangan' },
]
export default function Features() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const toggle = key => {
    const next = {...db, features:{...db.features, [key]:!db.features[key]}}
    saveDB(next); setDb(next)
    window.dispatchEvent(new Event('zk-features-changed'))
  }
  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-1">Toko Fitur</h1>
      <p className="text-inksoft text-[13px] mb-5">{user.role==='admin' ? 'Aktifkan modul yang tim Anda butuhkan — menu muncul otomatis.' : 'Modul aktif di tim Anda (dikelola admin).'}</p>
      <div className="grid md:grid-cols-2 gap-3.5">
        {CATALOG.map(f=>(
          <div key={f.key} className={'card p-5 flex gap-3.5 '+(db.features[f.key]?'ring-2 ring-blue/40':'')}>
            <div className="w-11 h-11 rounded-xl bg-blue-soft grid place-items-center text-xl shrink-0">{f.icon}</div>
            <div className="min-w-0">
              <b className="text-[14.5px]">{f.name}</b>
              <p className="text-[12.5px] text-inksoft mt-0.5">{f.desc}</p>
              <div className="mt-2.5">
                {user.role==='admin'
                  ? <button onClick={()=>toggle(f.key)} className={'pill font-bold cursor-pointer '+(db.features[f.key]?'bg-green-soft text-emerald-700':'bg-line text-inksoft')}>{db.features[f.key]?'Aktif — klik matikan':'Nonaktif — klik aktifkan'}</button>
                  : <span className={'pill '+(db.features[f.key]?'bg-green-soft text-emerald-700':'bg-line text-inksoft')}>{db.features[f.key]?'Aktif':'Nonaktif'}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}