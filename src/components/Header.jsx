import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const showBack = location.pathname !== '/';

  return (
    <header className="header">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <div className="d-flex align-items-center gap-3">
          {showBack && (
            <Link
              to="/"
              className="btn-back"
              aria-label="Volver al inicio"
            >
              <i className="bi bi-arrow-left"></i>
            </Link>
          )}
          <Link to="/" className="text-decoration-none">
            <h1 className="header-logo m-0">
              <span className="header-logo-anush">Anush.</span>
              <span className="header-logo-cuidarte">Cuidarte</span>
              <span className="header-logo-tools ms-2">Tools</span>
            </h1>
          </Link>
        </div>

        <nav className="d-flex align-items-center gap-2">
          {user ? (
            <>
              <Link to="/mi-suscripcion" className="btn-nav" title="Mi Suscripción">
                <i className="bi bi-credit-card"></i>
              </Link>
              <span className="small text-muted d-none d-sm-inline">{user.username}</span>
              <button className="btn-nav" onClick={logout} title="Cerrar sesión">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav" title="Iniciar sesión">
                <i className="bi bi-person"></i>
              </Link>
              <Link to="/register" className="btn btn-sm rounded-pill px-3"
                style={{ background: 'var(--anush-rose)', color: '#fff', border: 'none' }}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>

      <style>{`
        .header {
          background: var(--cream);
          border-bottom-left-radius: var(--radius-xl);
          border-bottom-right-radius: var(--radius-xl);
          box-shadow: 0 8px 32px rgba(201, 123, 132, 0.12);
        }
        .header-logo {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .header-logo-anush {
          color: var(--pink);
        }
        .header-logo-tools {
          color: var(--text-dark);
          font-weight: 400;
        }
        .btn-back {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--pink);
          border-radius: var(--radius-full);
          color: var(--pink);
          font-size: 1.2rem;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .btn-back:hover {
          background: var(--pink);
          color: white;
        }
        .btn-nav {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: var(--radius-full);
          background: transparent;
          color: var(--pink);
          font-size: 1.2rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .btn-nav:hover {
          background: rgba(201, 123, 132, 0.1);
        }
      `}</style>
    </header>
  );
}

export default Header;
