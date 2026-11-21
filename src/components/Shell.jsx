import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { currentUser, logout, loadDB, saveDB, logAct } from '@/lib/db.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard, ListChecks, FileText, Users, Megaphone, Clock, Package,
  Wallet, MessagesSquare, Puzzle, Plus, Search, PanelLeft, X, Menu, Moon, Sun,
  FolderKanban, Vote, BellPlus, LayoutGrid, ChevronRight,
} from 'lucide-react'

const baseNav = [
  { to:'/', icon:LayoutDashboard, name:'Beranda' },
  { to:'/tugas', icon:ListChecks, name:'Tugas & Tenggat' },
  { to:'/proyek', icon:FolderKanban, name:'Proyek & Progres' },
  { to:'/dokumen', icon:FileText, name:'Dokumen' },
  { to:'/voting', icon:Vote, name:'Voting' },
  { to:'/laporan', icon:FileText, name:'Laporan' },
  { to:'/tim', icon:Users, name:'Tim' },
  { to:'/lainnya', icon:LayoutGrid, name:'Kalender & Lainnya' },
]
const moduleNav = [
  { key:'announcements', to:'/pengumuman', icon:Megaphone, name:'Pengumuman' },
  { key:'attendance', to:'/absen', icon:Clock, name:'Absen' },
  { key:'inventory', to:'/inventori', icon:Package, name:'Inventori' },
  { key:'expenses', to:'/pengeluaran', icon:Wallet, name:'Pengeluaran' },
  { key:'chat', to:'/chat', icon:MessagesSquare, name:'Diskusi' },
]
const bottomPaths = ['/', '/tugas', '/proyek', '/chat']

const DOC_TEMPLATES = [
  { icon:'users', name:'Catatan Rapat & Tindak Lanjut', category:'Rapat & Koordinasi',
    blocks:[{type:'h1',content:'Agenda & Peserta Rapat'},{type:'paragraph',content:'Tuliskan konteks singkat dan tujuan utama pertemuan.'},{type:'h2',content:'Poin Keputusan & Tindak Lanjut'},{type:'todo',checked:false,content:'Tindak lanjut 1 — PIC & Tenggat'},{type:'todo',checked:false,content:'Tindak lanjut 2 — PIC & Tenggat'}] },
  { icon:'book-open', name:'SOP & Panduan Kerja', category:'Operasional',
    blocks:[{type:'h1',content:'Tujuan & Ruang Lingkup'},{type:'callout',content:'Pastikan setiap tahapan dilakukan berurutan.'},{type:'h2',content:'Langkah Pelaksanaan'},{type:'todo',checked:false,content:'Tahap persiapan'},{type:'todo',checked:false,content:'Tahap eksekusi & dokumentasi'}] },
  { icon:'target', name:'Ringkasan Proyek (Brief)', category:'Proyek',
    blocks:[{type:'h1',content:'Latar Belakang & Sasaran'},{type:'paragraph',content:'Masalah yang diselesaikan dan hasil akhir yang diharapkan.'},{type:'h2',content:'Milestones'},{type:'bullet',content:'Minggu 1: Perencanaan'},{type:'bullet',content:'Minggu 2: Implementasi'}] },
  { icon:'check-square', name:'Daftar Periksa Harian', category:'Pribadi',
    blocks:[{type:'h1',content:'Prioritas Utama Hari Ini'},{type:'todo',checked:false,content:'Selesaikan pekerjaan paling krusial'},{type:'todo',checked:false,content:'Tinjau pesan masuk & tindak lanjuti'}] },
]

export { DOC_TEMPLATES }

export default function Shell() {
  const user = currentUser()
  const nav2 = useNavigate()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('zk_sidebar_collapsed') === '1')
  const [drawer, setDrawer] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('zk_dark') === '1')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [quick, setQuick] = useState('')
  const [quickBucket, setQuickBucket] = useState('today')
  const searchRef = useRef(null)
  const [, force] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('zk_dark', dark ? '1' : '0')
  }, [dark])
  useEffect(() => { setDrawer(false); window.scrollTo(0,0) }, [loc.pathname])
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(v=>!v) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { if (searchOpen) setTimeout(()=>searchRef.current?.focus(), 50) }, [searchOpen])

  if (!user) return null

  const sync = () => force(v=>v+1)
  const db = loadDB()
  const feats = db.features
  const nav = [...baseNav, ...moduleNav.filter(m=>feats[m.key]), { to:'/fitur', icon:Puzzle, name:'Fitur' }]
  const pending = db.users.filter(u=>u.status==='pending' && u.teamId===user.teamId).length
  const team = db.teams.find(t=>t.id===user.teamId)
  const teamTasks = db.tasks.filter(t=>t.teamId===user.teamId)
  const openCount = teamTasks.filter(t=>t.status!=='Done').length
  const unread = db.messages.filter(m=>m.teamId===user.teamId && !m.readBy?.includes(user.id)).length
  const activePolls = db.polls.filter(p=>p.teamId===user.teamId && !p.closed).length

  const badges = {
    '/tugas': openCount, '/chat': unread, '/voting': activePolls,
    '/tim': pending, '/proyek': teamTasks.length ? Math.round(teamTasks.filter(t=>t.status==='Done').length / teamTasks.length * 100) + '%' : '',
  }

  const persist = next => { saveDB(next); sync() }

  const quickAdd = e => {
    e.preventDefault()
    const title = quick.trim(); if (!title) return
    const bucket = quickBucket
    const deadline = bucket === 'today' ? new Date().toISOString().slice(0,10)
      : bucket === 'upcoming' ? new Date(Date.now()+864e5).toISOString().slice(0,10) : ''
    const next = { ...db, tasks:[{ id:'t'+Date.now(), teamId:user.teamId, title, assignee:user.id, status:'To Do', priority:'Sedang', project:'Operasional', pinned: bucket==='today', deadline, note:'Dicatat cepat dari quick capture.', subtasks:[] }, ...db.tasks] }
    logAct(next, user, 'menambahkan tugas cepat "' + title + '"', 'bell-plus')
    persist(next); setQuick('')
  }

  const results = useMemo(() => {
    const q = searchQ.toLowerCase().trim()
    if (!q) return { pages: [], tasks: [], docs: [] }
    return {
      pages: nav.filter(n=>n.name.toLowerCase().includes(q)).slice(0,5),
      tasks: db.tasks.filter(t=>t.teamId===user.teamId && t.title.toLowerCase().includes(q)).slice(0,6),
      docs: (db.docs||[]).filter(d=>d.teamId===user.teamId && d.title.toLowerCase().includes(q)).slice(0,4),
    }
    // eslint-disable-next-line
  }, [searchQ, searchOpen])

  const sidebarBtn = (item, isActive, onClick, extra) => (
    <button key={item.to} onClick={onClick}
      className={'flex w-full items-center gap-2.5 rounded-lg py-2 px-2.5 text-xs transition ' +
        (isActive ? 'bg-subtle text-ink font-semibold dark:bg-zinc-800 dark:text-white' : 'text-inksoft hover:bg-subtle/70 hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-800/50') +
        (collapsed ? ' justify-center px-0 lg:px-0' : '')}>
      <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5}/>
      {!collapsed && <span className="truncate flex-1 text-left">{item.name}</span>}
      {!collapsed && extra}
    </button>
  )

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas dark:bg-zinc-950">
      {drawer && <div onClick={()=>setDrawer(false)} className="fixed inset-0 z-40 bg-zinc-950/30 lg:hidden" />}
      {/* Sidebar */}
      <aside className={'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-200 lg:static ' +
        (drawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0') + (collapsed ? ' lg:w-16' : '')}>
        <div className="flex h-14 items-center justify-between border-b border-line px-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs">KS</div>
            {!collapsed && <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight">Kerja Sama</span>
                <span className="rounded border border-line bg-subtle px-1.5 text-[10px] font-medium text-inksoft dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">{team?.name||'Tim'}</span>
              </div>
              <p className="text-[11px] text-dim truncate">Ruang Kerja & Pengingat</p>
            </div>}
          </div>
          <button onClick={()=>{setCollapsed(v=>!v); localStorage.setItem('zk_sidebar_collapsed', !collapsed?'1':'0')}} title="Perkecil/Perluas"
            className="hidden lg:grid h-7 w-7 place-items-center rounded-md text-inksoft hover:bg-subtle dark:text-zinc-400 dark:hover:bg-zinc-800">
            <PanelLeft className="h-4 w-4" strokeWidth={1.5}/></button>
          <button onClick={()=>setDrawer(false)} className="grid lg:hidden h-8 w-8 place-items-center rounded-lg text-inksoft hover:bg-subtle">
            <X className="h-4 w-4" strokeWidth={1.5}/></button>
        </div>

        <div className="p-3 space-y-2">
          <button onClick={()=>setSearchOpen(true)}
            className={'flex w-full items-center rounded-lg border border-line bg-canvas py-1.5 text-xs text-inksoft hover:bg-subtle dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400 transition ' + (collapsed?'justify-center px-0':'justify-between px-2.5')}>
            <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5 text-dim" strokeWidth={1.5}/>{!collapsed && 'Cari cepat...'}</span>
            {!collapsed && <kbd className="rounded border border-line bg-white px-1.5 font-mono text-[10px] text-dim dark:border-zinc-700 dark:bg-zinc-800">Ctrl K</kbd>}
          </button>
          <button onClick={()=>nav2('/dokumen?new=1')}
            className={'flex w-full items-center rounded-lg bg-ink py-2 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition ' + (collapsed?'justify-center px-0':'justify-center gap-1.5')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5}/>{!collapsed && 'Catatan / Halaman'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-5">
          <div>
            {!collapsed && <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-dim">Navigasi Utama</div>}
            <nav className="space-y-0.5">
              {nav.map(it => sidebarBtn(it, loc.pathname===it.to, ()=>nav2(it.to), (
                <span className="rounded-full border border-line bg-white px-1.5 font-mono text-[10px] font-medium text-inksoft dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {badges[it.to] || ''}
                </span>
              )))}
            </nav>
          </div>
        </div>

        <div className="border-t border-line p-3 dark:border-zinc-800 space-y-2.5">
          {!collapsed && <div className="rounded-lg border border-line bg-canvas px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="font-medium text-inksoft dark:text-zinc-400">Progres Pekerjaan</span>
              <span className="font-mono font-semibold text-ink dark:text-white">{teamTasks.length ? Math.round(teamTasks.filter(t=>t.status==='Done').length/teamTasks.length*100) : 0}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-hairline dark:bg-zinc-800">
              <div className="h-full rounded-full bg-ink dark:bg-zinc-100 transition-all" style={{width:(teamTasks.length?Math.round(teamTasks.filter(t=>t.status==='Done').length/teamTasks.length*100):0)+'%'}}/>
            </div>
          </div>}
          <div className="flex items-center justify-between gap-1">
            {!collapsed && <span className="flex items-center gap-2 text-[11px] text-inksoft"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>Tersimpan Lokal</span>}
            <div className={'flex items-center gap-1 ' + (collapsed?'w-full justify-center':'')}>
              <button onClick={()=>{logout(); nav2('/login')}} title="Keluar" className="rounded-lg p-1.5 text-inksoft hover:bg-subtle hover:text-ink dark:hover:bg-zinc-800">
                <svg className="h-4 w-4" strokeWidth={1.5} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
              <button onClick={()=>setDark(v=>!v)} title="Tema" className="grid place-items-center rounded-lg p-1.5 text-inksoft hover:bg-subtle hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-800">
                {dark ? <Sun className="h-4 w-4" strokeWidth={1.5}/> : <Moon className="h-4 w-4" strokeWidth={1.5}/>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 bg-canvas dark:bg-zinc-950">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={()=>setDrawer(true)} className="grid lg:hidden h-8 w-8 place-items-center rounded-lg border border-line text-inksoft dark:border-zinc-800">
              <Menu className="h-4 w-4" strokeWidth={1.5}/></button>
            <nav className="flex items-center gap-1.5 text-xs text-inksoft truncate">
              <span className="hidden sm:inline text-dim">Kerja Sama</span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-dim" strokeWidth={1.5}/>
              <span className="font-semibold text-ink dark:text-white truncate">{nav.find(n=>n.to===loc.pathname)?.name || 'Halaman'}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setSearchOpen(true)} className="grid sm:hidden h-8 w-8 place-items-center rounded-lg text-inksoft hover:bg-subtle dark:hover:bg-zinc-800">
              <Search className="h-4 w-4" strokeWidth={1.5}/></button>
            <span className="hidden md:block text-[12px] text-inksoft">Halo, <b className="text-ink dark:text-white">{user.name}</b></span>
            <NavLink to="/chat" className="hidden md:flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-inksoft hover:text-ink dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.5}/>Diskusi
            </NavLink>
            <button onClick={quickAddPrefill} className="btn-dark"><Plus className="h-3.5 w-3.5" strokeWidth={1.5}/><span className="hidden sm:inline">Tugas / Pengingat</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 lg:pb-24"><Outlet/></main>

        {/* Quick capture */}
        <div className="fixed bottom-14 lg:bottom-4 left-0 right-0 z-20 px-3 sm:px-6 pointer-events-none">
          <form onSubmit={quickAdd} className="mx-auto max-w-2xl pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-white/95 p-1.5 pl-3 shadow-float backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
            <BellPlus className="h-4 w-4 text-inksoft shrink-0" strokeWidth={1.5}/>
            <input value={quick} onChange={e=>setQuick(e.target.value)} placeholder="Catat tugas atau pengingat agar tidak lupa... (Enter)" className="w-full bg-transparent text-xs sm:text-sm text-ink placeholder-dim focus:outline-none dark:text-white"/>
            <select value={quickBucket} onChange={e=>setQuickBucket(e.target.value)} className="hidden sm:block rounded-md border border-line bg-canvas px-2 py-1 text-[11px] font-medium text-inksoft focus:outline-none dark:border-zinc-700 dark:bg-zinc-800">
              <option value="today">Hari Ini</option><option value="upcoming">Besok</option><option value="unscheduled">Tanpa Tenggat</option>
            </select>
            <button type="submit" className="btn-dark shrink-0">Simpan</button>
          </form>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-30 flex lg:hidden h-14 items-center justify-around border-t border-line bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          {nav.filter(n=>bottomPaths.includes(n.to)).map(it=>(
            <NavLink key={it.to} to={it.to} end={it.to==='/'} className={({isActive})=>'flex flex-col items-center gap-0.5 text-[10px] '+(isActive?'text-ink dark:text-white font-semibold':'text-dim')}>
              <it.icon className="h-4 w-4" strokeWidth={1.5}/>{it.name.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Search modal */}
      {searchOpen && <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        <div onClick={()=>setSearchOpen(false)} className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[1px]"/>
        <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-white shadow-float overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center border-b border-line px-4 py-3 dark:border-zinc-800">
            <Search className="h-4 w-4 text-dim mr-3" strokeWidth={1.5}/>
            <input ref={searchRef} value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari pekerjaan, pengingat, atau dokumen..." className="w-full bg-transparent text-sm focus:outline-none dark:text-white"/>
            <button onClick={()=>setSearchOpen(false)} className="font-mono text-[10px] text-dim hover:text-ink">ESC</button>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {results.pages.length>0 && <><div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Halaman</div>
              {results.pages.map(p=><button key={p.to} onClick={()=>{nav2(p.to); setSearchOpen(false)}} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle dark:hover:bg-zinc-800">
                <p.icon className="h-4 w-4 text-inksoft" strokeWidth={1.5}/><span className="font-medium">{p.name}</span></button>)}</>}
            {results.tasks.length>0 && <><div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Tugas & Tenggat</div>
              {results.tasks.map(t=><button key={t.id} onClick={()=>{nav2('/tugas?open='+t.id); setSearchOpen(false)}} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle dark:hover:bg-zinc-800">
                <span className="font-medium truncate">{t.title}</span><span className="font-mono text-[10px] text-inksoft">{t.deadline}</span></button>)}</>}
            {results.docs.length>0 && <><div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Dokumen</div>
              {results.docs.map(d=><button key={d.id} onClick={()=>{nav2('/dokumen?id='+d.id); setSearchOpen(false)}} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle dark:hover:bg-zinc-800">
                <FileText className="h-4 w-4 text-inksoft" strokeWidth={1.5}/><span className="font-medium truncate">{d.title}</span></button>)}</>}
            {searchQ && !results.pages.length && !results.tasks.length && !results.docs.length &&
              <p className="p-6 text-center text-xs text-dim">Tidak ada hasil untuk "{searchQ}"</p>}
          </div>
        </div>
      </div>}
    </div>
  )

  function quickAddPrefill() { nav2('/tugas?new=1') }
}
