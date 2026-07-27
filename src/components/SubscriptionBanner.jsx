import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';

export default function SubscriptionBanner({ message }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div
      className="rounded-4 p-3 mb-4 text-center"
      style={{
        background: 'linear-gradient(135deg, var(--anush-rose), var(--anush-pink))',
        color: '#fff',
      }}
    >
      <p className="mb-2 fw-semibold">
        {message || 'Alcanzaste el límite de uso gratuito'}
      </p>
      <Link to="/planes" className="btn btn-light rounded-pill btn-sm px-4">
        Ver Planes
      </Link>
    </div>
  );
}
