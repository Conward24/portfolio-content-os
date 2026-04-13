import Link from 'next/link';
import Head from 'next/head';

const NAV = [
  { href: '/', label: 'Generate', id: 'generate', icon: '✦' },
  { href: '/staging', label: 'Staging', id: 'staging', icon: '◎' },
  { href: '/calendar', label: 'Calendar', id: 'calendar', icon: '▦' },
  { href: '/library', label: 'Photo library', id: 'library', icon: '▤' },
  { href: '/topics', label: 'Topic feeds', id: 'topics', icon: '◈' },
  { href: '/strategy', label: 'Strategy guide', id: 'strategy', icon: '◐' },
  { href: '/advisor', label: 'Content Advisor', id: 'advisor', icon: '◉' },
];

const BRAND_LINKS = [
  { label: 'MyLÚA Health', dot: 'dot-mylua', href: 'https://myluahealth.com' },
  { label: 'Henway', dot: 'dot-henway', href: 'https://henwayai.com' },
  { label: 'Blabbing', dot: 'dot-blabbing', href: 'https://blabbing.io' },
];

export default function Layout({ children, title, active }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} — Portfolio Content OS` : 'Portfolio Content OS'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div style={{
              fontFamily: 'Raleway, sans-serif', fontSize: 15, fontWeight: 800,
              letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2
            }}>
              Portfolio<br />
              <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: 12 }}>Content OS</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Workspace</div>
            {NAV.map(item => (
              <Link key={item.id} href={item.href} className={`nav-item ${active === item.id ? 'active' : ''}`}>
                <span style={{ fontSize: 11, opacity: 0.5, minWidth: 14 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="nav-section" style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <div className="nav-section-label">Brands</div>
            {BRAND_LINKS.map(b => (
              <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" className="nav-item">
                <div className={`nav-dot ${b.dot}`} />
                {b.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              Dr. Michael Conward<br />
              <span style={{ opacity: 0.6 }}>MyLÚA · Henway · Blabbing</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
