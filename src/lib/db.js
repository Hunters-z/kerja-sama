// Data layer Kerja Sama: localStorage multi-user (demo) — adapter Supabase menyusul.
const KEY = 'zona_kerja_db_v1'
const seed = () => ({
  users: [
    // role: admin | member; status: active | pending
    { id:'u1', name:'Admin Lapangan', username:'admin', password:'admin123', role:'admin', teamId:'T-DEMO', status:'active', credId:null },
    { id:'u2', name:'Budi Lapangan', username:'budi', password:'budi123', role:'member', teamId:'T-DEMO', status:'active', credId:null },
  ],
  teams: [{ id:'T-DEMO', name:'Tim Demo', adminId:'u1' }],
  tasks: [
    { id:'t1', teamId:'T-DEMO', title:'Survey lokasi proyek Cibinong', assignee:'u2', status:'On Progress', priority:'Tinggi', project:'Operasional', pinned:false, deadline: new Date(Date.now()+864e5).toISOString().slice(0,10), note:'', subtasks:[] },
    { id:'t2', teamId:'T-DEMO', title:'Kirim laporan mingguan', assignee:'u2', status:'To Do', priority:'Sedang', project:'Operasional', pinned:true, deadline: new Date(Date.now()+3*864e5).toISOString().slice(0,10), note:'', subtasks:[] },
    { id:'t3', teamId:'T-DEMO', title:'Sinkronisasi data sensor', assignee:'u1', status:'Done', priority:'Rendah', project:'Proyek Demo', pinned:false, deadline: new Date(Date.now()-864e5).toISOString().slice(0,10), note:'', subtasks:[] },
  ],
  projects: [
    { id:'p1', teamId:'T-DEMO', name:'Proyek Demo', description:'Contoh proyek untuk melacak progres pekerjaan tim.', deadline: new Date(Date.now()+14*864e5).toISOString().slice(0,10) },
    { id:'p2', teamId:'T-DEMO', name:'Operasional', description:'Pekerjaan rutin & koordinasi harian tim.', deadline: '' },
  ],
  docs: [
    { id:'d1', teamId:'T-DEMO', icon:'file-text', title:'Catatan Rapat Kick-off', category:'Rapat & Koordinasi', pic:'Admin Lapangan', updatedAt:'Baru saja',
      blocks: [
        { id:'b1', type:'h1', content:'Agenda & Peserta Rapat' },
        { id:'b2', type:'paragraph', content:'Konteks singkat dan tujuan utama pertemuan.' },
        { id:'b3', type:'todo', checked:false, content:'Tindak lanjut 1 — PIC & Tenggat Waktu' },
      ] },
  ],
  snippets: [
    { id:'s1', teamId:'T-DEMO', title:'Template Laporan', content:'Progress: \nKendala: \nRencana besok: ' },
  ],
  activity: [
    { id:'a1', teamId:'T-DEMO', actor:'Sistem', action:'Ruang kerja dibuat', icon:'sparkles', at:new Date().toISOString() },
  ],
  reports: [
    { id:'r1', teamId:'T-DEMO', userId:'u2', title:'Laporan mingguan #1', body:'Progress survey 70%, kendala cuaca.', at:new Date().toISOString() },
  ],
  features: { announcements: true, attendance: true, inventory: false, expenses: false, chat: true },
  announcements: [],
  attendance: [],
  inventory: [],
  expenses: [],
  messages: [],
  polls: [],
  session: null,
})

export function loadDB() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY))
    if (!db) return seed()
    // migrasi: pastikan field baru ada
    const s = seed()
    for (const k of ['projects','docs','snippets','activity','polls','messages'])
      if (!Array.isArray(db[k])) db[k] = s[k]
    for (const t of db.tasks || []) {
      if (!t.subtasks) t.subtasks = []
      if (!t.priority) t.priority = 'Sedang'
      if (!t.project) t.project = 'Operasional'
      if (t.pinned === undefined) t.pinned = false
    }
    return db
  } catch { return seed() }
}
export function saveDB(db) { localStorage.setItem(KEY, JSON.stringify(db)) }
export function logAct(db, actor, action, icon='activity') {
  db.activity = [{ id:'a'+Date.now(), teamId:actor.teamId, actor:actor.name, action, icon, at:new Date().toISOString() }, ...(db.activity||[])].slice(0,80)
}
export function login(username, password) {
  const db = loadDB()
  const u = db.users.find(x=>x.username.toLowerCase()===username.toLowerCase() && x.password===password)
  if (!u) return { error:'Username atau password salah' }
  if (u.status!=='active') return { error:'Akun masih menunggu persetujuan admin' }
  db.session = u.id; saveDB(db); return { user:u }
}
export function register({name, username, password, teamId}) {
  const db = loadDB()
  if (db.users.some(x=>x.username.toLowerCase()===username.toLowerCase())) return { error:'Username sudah dipakai' }
  const role = teamId && db.teams.some(t=>t.id===teamId) ? 'admin' : 'admin'
  const tid = teamId || ('T-'+Math.random().toString(36).slice(2,7).toUpperCase())
  if (!db.teams.some(t=>t.id===tid)) db.teams.push({ id:tid, name:'Tim '+username, adminId:'u'+Date.now() })
  const u = { id:'u'+Date.now(), name, username, password, role, teamId:tid, status:'active', credId:null }
  db.users.push(u); db.session = u.id; saveDB(db)
  return { user:u }
}
export function currentUser() {
  const db = loadDB()
  return db.users.find(u=>u.id===db.session) || null
}
export function logout() { const db=loadDB(); db.session=null; saveDB(db) }
