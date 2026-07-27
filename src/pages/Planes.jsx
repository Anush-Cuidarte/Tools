import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Planes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getPlanes()
      .then(setPlanes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = async (plan) => {
    try {
      const result = await api.crearSuscripcion(plan.id);
      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        navigate('/mi-suscripcion');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="text-center mb-2" style={{ color: 'var(--anush-rose)' }}>
        Planes de Suscripción
      </h2>
      <p className="text-center text-muted mb-4">
        Elegí el plan que mejor se adapte a tus necesidades
      </p>

      {error && (
        <div className="alert alert-danger py-2 small">{error}</div>
      )}

      <div className="row g-3 justify-content-center">
        {planes.map((plan) => (
          <div key={plan.id} className="col-12 col-sm-6 col-lg-4">
            <div
              className="card border-0 h-100 rounded-4 p-3 text-center"
              style={{
                borderLeft: '4px solid var(--anush-rose)',
                backgroundColor: '#FDF0F0',
              }}
            >
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{plan.name}</h5>
                <p className="card-text small text-muted flex-grow-1">
                  {plan.description}
                </p>
                <p className="h3 fw-bold" style={{ color: 'var(--anush-rose)' }}>
                  ${parseFloat(plan.price_ars).toLocaleString('es-AR')}
                </p>
                {plan.duration_days && (
                  <p className="small text-muted">
                    cada {plan.duration_days} días
                  </p>
                )}
                <button
                  className="btn rounded-pill mt-2"
                  style={{
                    backgroundColor: 'var(--anush-rose)',
                    color: '#fff',
                  }}
                  onClick={() => handleSelectPlan(plan)}
                >
                  Suscribirme
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <button
          className="btn btn-outline-secondary rounded-pill"
          onClick={() => navigate('/mi-suscripcion')}
        >
          Ver mi suscripción actual
        </button>
      </div>
    </div>
  );
}
