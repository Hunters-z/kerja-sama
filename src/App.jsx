import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import Reports from './pages/Reports.jsx'
import Team from './pages/Team.jsx'
import Shell from './components/Shell.jsx'

function Guard({children}) {
  const id = localStorage.getItem('zona_kerja_db_v1')
  const ok = id && JSON.parse(id).session
  return ok ? children : <Navigate to="/login" replace/>
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route element={<Guard><Shell/></Guard>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/tugas" element={<Tasks/>}/>
        <Route path="/laporan" element={<Reports/>}/>
        <Route path="/tim" element={<Team/>}/>
      </Route>
    </Routes>
  )
}