import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Sesi lokal di localStorage untuk token user aktif (mempertahankan UX SPA tanpa redirect login terus)
const SESSION_KEY = 'zona_kerja_session_v1'

export async function getCurrentUser() {
  const uid = localStorage.getItem(SESSION_KEY)
  if (!uid) return null
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error || !data) return null
  return data
}

export async function setCurrentUser(user) {
  if (user) localStorage.setItem(SESSION_KEY, user.id)
  else localStorage.removeItem(SESSION_KEY)
}

export async function login(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .eq('password', password)
    .single()

  if (error || !data) return { error: 'Username atau password salah' }
  if (data.status !== 'active') return { error: 'Akun masih menunggu persetujuan admin' }
  
  await setCurrentUser(data)
  return { user: data }
}

export async function register({ name, username, password, teamId }) {
  // Cek username
  const { data: existing } = await supabase.from('users').select('id').ilike('username', username).single()
  if (existing) return { error: 'Username sudah dipakai' }

  const tid = teamId || ('T-' + Math.random().toString(36).slice(2, 7).toUpperCase())
  
  // Cek apakah tim ada
  const { data: teamCheck } = await supabase.from('teams').select('*').eq('id', tid).single()
  if (!teamCheck.data) {
    await supabase.from('teams').insert([{ id: tid, name: 'Tim ' + username }])
  }

  const role = teamId ? 'member' : 'admin'
  const newUserId = 'u' + Date.now()

  const { data: newUser, error } = await supabase.from('users').insert([{
    id: newUserId,
    team_id: tid,
    name,
    username,
    password,
    role,
    status: 'active'
  }]).select().single()

  if (error) return { error: error.message }

  await setCurrentUser(newUser)
  return { user: newUser }
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY)
}

// Isi data dema saat user baru join / belum ada data
export async function seedDemoData(teamId) {
  const now = new Date().toISOString().slice(0,10)
  const tomorrow = new Date(Date.now()+864e5).toISOString().slice(0,10)
  const nextweek = new Date(Date.now()+7*864e5).toISOString().slice(0,10)
  
  // Seed project
  const { data: proj } = await supabase.from('projects').insert([{
    id: 'PRJ-001', team_id: teamId, name: 'Proyek Sample', status: 'On Progress'
  }]).select().single()

  // Seed tasks
  await supabase.from('tasks').insert([
    { id:'T-001', team_id: teamId, title:'Riset UI Dashboard', assignee:'u-demo', status:'Done', priority:'Tinggi', deadline: now, project:proj?.id },
    { id:'T-002', team_id: teamId, title:'Integrasi Supabase Auth', assignee:'u-demo', status:'On Progress', priority:'Sedang', deadline: tomorrow, project:proj?.id },
    { id:'T-003', team_id: teamId, title:'Review PR #42', assignee:'u-demo', status:'To Do', priority:'Rendah', deadline: nextweek, project:proj?.id },
    { id:'T-004', team_id: teamId, title:'Deploy ke Vercel', assignee:'u-demo', status:'Review', priority:'Tinggi', deadline: tomorrow, project:proj?.id },
  ])

  // Seed docs
  await supabase.from('docs').insert([
    { id:'D-001', team_id: teamId, title:'Panduan Penggunaan App', category:'Dokumentasi', content:'Ini contoh isi catatan...' },
    { id:'D-002', team_id: teamId, title:'Skema Database', category:'Teknis', content:'Tabel users, teams, tasks...' },
  ])

  // Seed polls
  await supabase.from('polls').insert([{
    id:'V-001', team_id: teamId, q:'Menuju fitur apa selanjutnya?', opts:['Notifikasi Realtime','Export PDF Laporan','Mode Offline'], votes:{}
  }])

  return true
}

export async function logAct(teamId, actorName, action, icon = 'activity') {
  await supabase.from('activity').insert([{
    team_id: teamId,
    actor: actorName,
    action,
    icon
  }])
}
