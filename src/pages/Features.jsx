import { useState } from 'react'
import { loadDB, saveDB, currentUser } from '@/lib/db.js'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const CATALOG = [
  { key:'announcements', icon:'📣', name:'Pengumuman', desc:'Admin kirim pengumuman ke seluruh tim' },
  { key:'attendance', icon:'⏰', name:'Absen Hadir', desc:'Anggota absen masuk/pulang dengan waktu tercatat' },
  { key:'inventory', icon:'📦', name:'Inventori Lapangan', desc:'Catat peralatan & stok barang tim' },
  { key:'expenses', icon:'💸', name:'Pengeluaran Tim', desc:'Catat biaya operasional lapangan' },
  { key:'chat', icon:'💬', name:'Chat Tim', desc:'Pesan, voting, dan kirim file dalam tim' },
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
          <Card key={f.key} className={'p-5 flex gap-3.5 '+(db.features[f.key]?'ring-2 ring-blue/40':'')}>
            <div className="w-11 h-11 rounded-xl bg-blue-soft grid place-items-center text-xl shrink-0">{f.icon}</div>
            <div className="min-w-0">
              <b className="text-[14.5px]">{f.name}</b>
              <p className="text-[12.5px] text-inksoft mt-0.5">{f.desc}</p>
              <div className="mt-2.5">
                {user.role==='admin'
                  ? <Button onClick={()=>toggle(f.key)} size="sm" variant="ghost" className={'rounded-full h-6 px-2.5 text-[10px] font-bold '+(db.features[f.key]?'bg-green-soft text-emerald-700 hover:bg-green hover:text-white':'bg-line text-inksoft hover:bg-card2')}>{db.features[f.key]?'Aktif — klik matikan':'Nonaktif — klik aktifkan'}</Button>
                  : <Badge variant={db.features[f.key]?'success':'secondary'}>{db.features[f.key]?'Aktif':'Nonaktif'}</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
