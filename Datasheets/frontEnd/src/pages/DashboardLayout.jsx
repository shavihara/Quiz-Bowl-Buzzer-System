import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function DashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.left}>
          <div style={styles.logoCircle}></div>
          <div style={styles.appName}>Quiz Buzzer System</div>
        </div>
        <nav style={styles.nav}>
          <NavLink to="/dashboard/home" style={styles.link}>Home</NavLink>
          <NavLink to="/dashboard/about" style={styles.link}>AboutUs</NavLink>
          <NavLink to="/dashboard/history" style={styles.link}>History</NavLink>
        </nav>
        <div style={styles.right}>
          <button onClick={onLogout} style={styles.logout}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  wrapper: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#000' },
  header: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center',
    padding: 'clamp(12px, 2vw, 18px)', gap: 'clamp(10px, 2vw, 20px)',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
  },
  left: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoCircle: {
    width: 'clamp(28px, 4vw, 40px)', height: 'clamp(28px, 4vw, 40px)', borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #ffd700, #fff, #ffd700)', boxShadow: '0 0 20px #ffd70055',
  },
  appName: { fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 800, color: '#fff' },
  nav: { display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' },
  link: { color: '#ffd700', textDecoration: 'none', fontWeight: 700 },
  right: { display: 'flex', justifyContent: 'flex-end' },
  logout: {
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 20px)', borderRadius: 12, border: 'none',
    fontWeight: 800, background: 'linear-gradient(135deg, #ffd700, #fff)', color: '#000', cursor: 'pointer'
  },
  main: { flex: 1, overflow: 'hidden', padding: 'clamp(12px, 2vw, 20px)' },
}

