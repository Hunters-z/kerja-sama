import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { currentUser, logout, loadDB } from '../lib/db.js'
import { useEffect, useState } from 'react'

const baseNav = [
  { to:'/', icon:'▦', name:'Beranda' },
  { to:'/tugas', icon:'✅', name:'Tugas' },
  { to:'/laporan', icon:'📝', name:'Laporan' },
  { to:'/tim', icon:'👥', name:'Tim' },
]
const moduleNav = [
  { key:'announcements', to:'/pengumuman', icon:'📣', name:'Pengumuman' },
  { key:'attendance', to:'/absen', icon:'⏰', name:'Absen' },
  { key:'inventory', to:'/inventori', icon:'📦', name:'Inventori' },
  { key:'expenses', to:'/pengeluaran', icon:'💸', name:'Pengeluaran' },
  { key:'chat', to:'/chat', icon:'💬', name:'Chat' },
]
const featureNav = feats => [...moduleNav.filter(m=>feats[m.key]), { to:'/fitur', icon:'🧩', name:'Fitur' }]
const bottom = ['/','/tugas','/laporan','/tim']
export default function Shell() {
  const [user, setUser] = useState(currentUser())
  const [pending, setPending] = useState(0)
  const [nav, setNav] = useState(baseNav)
  const nav2 = useNavigate()
  useEffect(()=>{
    const sync = () => {
      setPending(loadDB().users.filter(u=>u.status==='pending').length)
      setNav([...baseNav, ...featureNav(loadDB().features)])
    }
    sync()
    window.addEventListener('zk-features-changed', sync)
    return () => window.removeEventListener('zk-features-changed', sync)
  }, [])
  if (!user) return null
  const team = loadDB().teams.find(t=>t.id===user.teamId)
  return (
    <div className="min-h-screen bg-bg">
      {/* Header pill */}
      <header className="sticky top-0 z-40 px-3 md:px-5 pt-3">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-soft border border-line pl-4 pr-2 h-14 max-w-6xl mx-auto">
          <span className="font-disp font-extrabold text-blue">Kerja<span className="text-ink">Sama</span></span>
          <span className="pill bg-blue-soft text-blue-dark hidden sm:inline">{team?.name||'Tim'}</span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden md:block text-[12.5px] text-inksoft">Halo, <b className="text-ink">{user.name}</b></span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue to-violet text-white grid place-items-center text-[11px] font-bold">{user.name.slice(0,2).toUpperCase()}</div>
            <button onClick={()=>{logout(); nav2('/login')}} className="pill bg-card2 text-inksoft hover:bg-red-soft hover:text-red">Keluar</button>
          </div>
        </div>
      </header>
      <div className="flex max-w-6xl mx-auto px-3 md:px-5">
        {/* Sidebar kartu */}
        <aside className="hidden md:flex flex-col gap-1 bg-white border border-line rounded-2xl shadow-soft w-[215px] shrink-0 p-2.5 sticky top-[76px] h-[calc(100vh-96px)] mt-3">
          {nav.map(it=>(
            <NavLink key={it.to} to={it.to} end={it.to==='/'}
              className={({isActive})=>'flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition '+
                (isActive?'bg-blue text-white':'text-inksoft hover:bg-card2 hover:text-ink')}>
              <span className="w-5 text-center">{it.icon}</span>{it.name}
              {it.to==='/tim' && pending>0 && <span className="ml-auto bg-gold text-white text-[10px] px-2 py-0.5 rounded-full">{pending}</span>}
            </NavLink>
          ))}
          <div className="mt-auto text-[10.5px] text-dim px-3 py-2">Kerja Sama · data lokal</div>
        </aside>
        <main className="flex-1 min-w-0 pb-24 md:pb-6"><Outlet/></main>
      </div>
      {/* Bottom-nav mengambang */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 bg-white rounded-full shadow-pop border border-line flex h-16">
        {nav.filter(n=>bottom.includes(n.to)).map(it=>(
          <NavLink key={it.to} to={it.to} end={it.to==='/'} className={({isActive})=>'flex-1 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-semibold rounded-full '+(isActive?'bg-blue-soft text-blue-dark':'text-inksoft')}>
            <span className="text-lg">{it.icon}</span>{it.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
