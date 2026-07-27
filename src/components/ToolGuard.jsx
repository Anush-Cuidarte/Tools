import { useAuth } from '../services/auth';
import { DemoProvider } from '../services/demo';

/**
 * Wrapper for tool routes.
 *
 * - Authenticated user → renders children directly (full access).
 * - Unauthenticated → wraps children in <DemoProvider> for demo limits.
 *
 * Unlike AuthGuard, this NEVER redirects — tools are always accessible.
 */
function ToolGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border" style={{ color: 'var(--pink)' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Authenticated user → no limits
  if (user) {
    return <>{children}</>;
  }

  // Demo mode → wrap with DemoProvider for limits + upgrade modal
  return (
    <DemoProvider>
      {children}
    </DemoProvider>
  );
}

export default ToolGuard;
