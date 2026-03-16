import { Link, Outlet, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/', label: '🍴 Customer Menu' },
  { path: '/kds', label: '🖥️ Kitchen Display' },
  { path: '/dashboard', label: '📊 Manager Dashboard' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      <nav
        style={{
          background: '#1a1a2e',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 52,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, marginRight: 24, fontSize: 16 }}>
          🍴 IRMS
        </span>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              color: location.pathname === link.path ? '#f5a623' : '#ccc',
              textDecoration: 'none',
              fontWeight: location.pathname === link.path ? 700 : 400,
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
