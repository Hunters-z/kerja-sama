// Data layer zona-kerja: localStorage multi-user (demo) — adapter Supabase menyusul.
const KEY = 'zona_kerja_db_v1'
const seed = {
  users: [
    // role: admin | member; status: active | pending
    { id:'u1', name:'Admin Lapangan', username:'admin', password:'admin123', role:'admin', teamId:'T-DEMO', status:'active', credId:null },
    { id:'u2', name:'Budi Lapangan', username:'budi', password:'budi123', role:'member', teamId:'T-DEMO', status:'active', credId:null },
  ],
  teams: [{ id:'T-DEMO', name:'Tim Demo', adminId:'u1' }],
  tasks: [
    { id:'t1', teamId:'T-DEMO', title:'Survey lokasi proyek Cibinong', assignee:'u2', status:'On Progress', deadline: new Date(Date.now()+864e5).toISOString().slice(0,10), note:'' },
    { id:'t2', teamId:'T-DEMO', title:'Kirim laporan mingguan', assignee:'u2', status:'To Do', deadline: new Date(Date.now()+3*864e5).toISOString().slice(0,10), note:'' },
    { id:'t3', teamId:'T-DEMO', title:'Sinkronisasi data sensor', assignee:'u1', status:'Done', deadline: new Date(Date.now()-864e5).toISOString().slice(0,10), note:'' },
  ],
  reports: [
    { id:'r1', teamId:'T-DEMO', userId:'u2', title:'Laporan mingguan #1', body:'Progress survey 70%, kendala cuaca.', at:new Date().toISOString() },
  ],
  session: null,
}
export function loadDB() {
  try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed) }
  catch { return structuredClone(seed) }
}
export function saveDB(db) { localStorage.setItem(KEY, JSON.stringify(db)) }
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
