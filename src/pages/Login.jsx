import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAuth } from '../services/auth';
import { authUrl } from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="text-center mb-1" style={{ color: 'var(--anush-rose)' }}>
          Iniciar Sesión
        </h2>
        <p className="text-center text-muted small mb-4">
          Ingresá con tu cuenta de Anush Cuidarte
        </p>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <GoogleLoginButton />

        <div className="d-flex align-items-center my-3">
          <div className="flex-grow-1" style={{ height: 1, background: '#e5d5d5' }}></div>
          <span className="text-muted small px-3">o</span>
          <div className="flex-grow-1" style={{ height: 1, background: '#e5d5d5' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label small">
              Usuario
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label small">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 rounded-pill py-2"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 small">
          <a href={authUrl('accounts/password/reset/')} className="text-decoration-none" style={{ color: 'var(--anush-rose)' }}>
            ¿Olvidaste tu contraseña?
          </a>
        </p>

        <p className="text-center mt-2 mb-0 small">
          ¿No tenés cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--anush-rose)' }}>
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
