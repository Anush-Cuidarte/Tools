import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAuth } from '../services/auth';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [emailHasGoogle, setEmailHasGoogle] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailHasGoogle(false);

    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setEmailHasGoogle(err.code === 'google_account_exists');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="text-center mb-1" style={{ color: 'var(--anush-rose)' }}>
          Crear Cuenta
        </h2>
        <p className="text-center text-muted small mb-4">
          Registrate para usar las herramientas de Anush Cuidarte
        </p>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
            {emailHasGoogle && (
              <div className="mt-1">
                <Link to="/login" style={{ color: 'var(--anush-rose)' }}>
                  Iniciar sesión
                </Link>
              </div>
            )}
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
            <label htmlFor="email" className="form-label small">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
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
              minLength={8}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password2" className="form-label small">
              Repetir Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="password2"
              value={form.password2}
              onChange={(e) => setForm({ ...form, password2: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 rounded-pill py-2"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 small">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--anush-rose)' }}>
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
