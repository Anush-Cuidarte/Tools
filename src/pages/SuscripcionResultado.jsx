import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const MESSAGES = {
  exito: {
    title: '¡Pago exitoso!',
    subtitle: 'Tu suscripción ya está activa. Ya podés usar todas las herramientas.',
    icon: 'bi-check-circle-fill',
    color: 'var(--anush-green)',
  },
  error: {
    title: 'El pago no pudo completarse',
    subtitle: 'Ocurrió un error al procesar el pago. Podés intentarlo de nuevo.',
    icon: 'bi-x-circle-fill',
    color: '#dc3545',
  },
  pending: {
    title: 'Pago pendiente',
    subtitle: 'Estamos esperando la confirmación del pago. Te avisaremos cuando se acredite.',
    icon: 'bi-clock-fill',
    color: '#ffc107',
  },
};

export default function SuscripcionResultado() {
  const { tipo } = useParams();
  const msg = MESSAGES[tipo] || MESSAGES.error;

  // Re-verify the subscription status with the backend when returning from MP.
  // The backend syncs the latest preapproval with MP, so a subscription stuck
  // on "pending" locally (e.g. missed webhook) gets corrected on arrival.
  useEffect(() => {
    if (tipo === 'exito' || tipo === 'pending') {
      api.miSuscripcion().catch(() => {});
    }
  }, [tipo]);

  return (
    <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
      <div className="card border-0 shadow-sm rounded-4 p-5">
        <i className={`bi ${msg.icon}`} style={{ fontSize: '4rem', color: msg.color }} />
        <h3 className="mt-3" style={{ color: msg.color }}>
          {msg.title}
        </h3>
        <p className="text-muted">{msg.subtitle}</p>
        <div className="d-flex gap-2 justify-content-center mt-3">
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            Ir a Herramientas
          </Link>
          <Link to="/mi-suscripcion" className="btn btn-outline-secondary rounded-pill px-4">
            Ver Suscripción
          </Link>
        </div>
      </div>
    </div>
  );
}
