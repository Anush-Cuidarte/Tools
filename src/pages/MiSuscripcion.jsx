import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import api from '../services/api';

export default function MiSuscripcion() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .miSuscripcion()
      .then(setSubscriptions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const activeSub = subscriptions.find((s) => s.estado === 'active');

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h2 className="text-center mb-4" style={{ color: 'var(--anush-rose)' }}>
        Mi Suscripción
      </h2>

      {!activeSub && !subscriptions.length && (
        <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
          <i className="bi bi-credit-card" style={{ fontSize: '3rem', color: 'var(--anush-rose)' }} />
          <p className="mt-3 text-muted">No tenés ninguna suscripción activa.</p>
          <button
            className="btn btn-primary rounded-pill px-4 align-self-center"
            onClick={() => navigate('/planes')}
          >
            Ver Planes
          </button>
        </div>
      )}

      {activeSub && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">{activeSub.plan.name}</h5>
            <span className="badge bg-success rounded-pill">Activa</span>
          </div>
          <p className="small text-muted mb-2">{activeSub.plan.description}</p>
          <hr />
          <div className="row small">
            <div className="col-6">
              <span className="text-muted">Inicio:</span>{' '}
              {new Date(activeSub.start_date).toLocaleDateString('es-AR')}
            </div>
            <div className="col-6">
              <span className="text-muted">Expira:</span>{' '}
              {activeSub.end_date
                ? new Date(activeSub.end_date).toLocaleDateString('es-AR')
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Demo info */}
      {userInfo?.is_demo_user && !activeSub && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#FDF8F5' }}>
          <h6 className="mb-0" style={{ color: 'var(--anush-brown)' }}>
            <i className="bi bi-star-fill me-1" />
            Acceso Demo
          </h6>
          <p className="small text-muted mt-2 mb-0">
            Estás usando las herramientas con acceso demo. Si querés acceder a todas las funcionalidades,
            suscribite a un plan.
          </p>
        </div>
      )}

      {/* Historial */}
      {subscriptions.length > 1 && (
        <div className="mt-4">
          <h6 className="text-muted mb-2">Historial</h6>
          {subscriptions.slice(1).map((sub) => (
            <div
              key={sub.id}
              className="card border-0 shadow-sm rounded-3 p-3 mb-2"
            >
              <div className="d-flex justify-content-between">
                <span>{sub.plan.name}</span>
                <span className={`badge bg-${sub.estado === 'active' ? 'success' : 'secondary'} rounded-pill`}>
                  {sub.estado}
                </span>
              </div>
              <small className="text-muted">
                {new Date(sub.start_date).toLocaleDateString('es-AR')}
              </small>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-3">
        <button
          className="btn btn-outline-primary rounded-pill"
          onClick={() => navigate('/planes')}
        >
          Ver todos los planes
        </button>
      </div>
    </div>
  );
}
