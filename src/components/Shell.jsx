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
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-line">
        <div className="flex items-center gap-3 px-4 md:px-7 h-14">
          <span className="font-disp font-extrabold text-blue flex items-center gap-1.5">zona<span className="text-ink">_kerja_</span>.</span>
          <span className="pill bg-blue-soft text-blue-dark hidden sm:inline">{team?.name||'Tim'}</span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden md:block text-[12.5px] text-inksoft">Halo, <b className="text-ink">{user.name}</b></span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-violet text-white grid place-items-center text-[11px] font-bold">{user.name.slice(0,2).toUpperCase()}</div>
            <button onClick={()=>{logout(); nav2('/login')}} className="pill bg-line text-inksoft hover:bg-red-soft hover:text-red">Keluar</button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden md:flex flex-col gap-1 w-[220px] shrink-0 p-3">
          {nav.map(it=>(
            <NavLink key={it.to} to={it.to} end={it.to==='/'}
              className={({isActive})=>'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition '+
                (isActive?'bg-blue text-white shadow-soft':'text-inksoft hover:bg-blue-soft/50 hover:text-blue-dark')}>
              <span className="w-5 text-center">{it.icon}</span>{it.name}
              {it.to==='/tim' && pending>0 && <span className="ml-auto bg-amber text-white text-[10px] px-2 py-0.5 rounded-full">{pending}</span>}
            </NavLink>
          ))}
        </aside>
        <main className="flex-1 min-w-0 pb-24 md:pb-6"><Outlet/></main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line flex">
        {nav.filter(n=>bottom.includes(n.to)).map(it=>(
          <NavLink key={it.to} to={it.to} end={it.to==='/'} className={({isActive})=>'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold '+(isActive?'text-blue':'text-inksoft')}>
            <span className="text-lg">{it.icon}</span>{it.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}