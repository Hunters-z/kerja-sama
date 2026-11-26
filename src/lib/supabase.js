import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SESSION_KEY = 'zona_kerja_session_v1'

export async function getCurrentUser() {
  const uid = localStorage.getItem(SESSION_KEY)
  if (!uid) return null
  
  const isPlaceholder = supabaseUrl.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL
  if (isPlaceholder) {
    try {
      const raw = localStorage.getItem('zona_kerja_db_v1')
      if (raw) {
        const db = JSON.parse(raw)
        const u = db.users?.find(x => x.id === uid)
        if (u) return { ...u, team_id: u.teamId || 'T-DEMO' }
      }
    } catch {}
    // Fallback default admin user jika localStorage kosong
    return { id: 'u-admin', team_id: 'T-DEMO', name: 'Admin Demo', username: 'admin', role: 'admin' }
  }

  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error || !data) return null
  return data
}

export async function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, user.id)
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export async function login(username, password) {
  const isPlaceholder = supabaseUrl.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL
  if (isPlaceholder) {
    let db = { users: [{ id: 'u-admin', team_id: 'T-DEMO', name: 'Admin Demo', username: 'admin', password: 'admin123', role: 'admin', status: 'active' }, { id: 'u-budi', team_id: 'T-DEMO', name: 'Budi Lapangan', username: 'budi', password: 'budi123', role: 'member', status: 'active' }], tasks: [], projects: [], docs: [], polls: [] }
    try {
      const raw = localStorage.getItem('zona_kerja_db_v1')
      if (raw) db = JSON.parse(raw)
    } catch {}
    
    const found = db.users.find(x => x.username.toLowerCase() === username.toLowerCase() && x.password === password)
    if (!found) return { error: 'Username atau password salah (Coba: admin / admin123)' }
    
    await setCurrentUser(found)
    return { user: found }
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .eq('password', password)
    .single()

  if (error || !data) return { error: 'Username atau password salah' }
  await setCurrentUser(data)
  return { user: data }
}

export async function register({ name, username, password, teamId }) {
  const isPlaceholder = supabaseUrl.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL
  if (isPlaceholder) {
    let db = { users: [], tasks: [], projects: [], docs: [], polls: [] }
    try {
      const raw = localStorage.getItem('zona_kerja_db_v1')
      if (raw) db = JSON.parse(raw)
    } catch {}

    if (db.users.find(x => x.username.toLowerCase() === username.toLowerCase())) {
      return { error: 'Username sudah dipakai' }
    }

    const newUser = {
      id: 'u' + Date.now(),
      team_id: teamId || ('T-' + Math.random().toString(36).slice(2, 7).toUpperCase()),
      name,
      username,
      password,
      role: teamId ? 'member' : 'admin',
      status: 'active'
    }
    db.users.push(newUser)
    localStorage.setItem('zona_kerja_db_v1', JSON.stringify(db))
    await setCurrentUser(newUser)
    return { user: newUser }
  }

  const tid = teamId || ('T-' + Math.random().toString(36).slice(2, 7).toUpperCase())
  const newUserId = 'u' + Date.now()
  const { data: newUser, error } = await supabase.from('users').insert([{
    id: newUserId,
    team_id: tid,
    name,
    username,
    password,
    role: teamId ? 'member' : 'admin',
    status: 'active'
  }]).select().single()

  if (error) return { error: error.message }
  await setCurrentUser(newUser)
  return { user: newUser }
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export async function seedDemoData(teamId) {
  return true
}

export async function logAct() {}
