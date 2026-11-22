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

export async function logAct(teamId, actorName, action, icon = 'activity') {
  await supabase.from('activity').insert([{
    team_id: teamId,
    actor: actorName,
    action,
    icon
  }])
}
