import { useNavigate } from 'react-router-dom';

function UpgradeModal({ show, blockedAction, onClose, title: customTitle }) {
  const navigate = useNavigate();

  if (!show) return null;

  const title = customTitle || (
    blockedAction === 'export'
      ? 'Alcanzaste el límite de exportaciones de prueba'
      : 'Alcanzaste el límite de cálculos de prueba'
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal d-block fade show"
        tabIndex={-1}
        style={{ zIndex: 1055 }}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="modal-header border-0 pb-0">
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Cerrar"
              />
            </div>

            <div className="modal-body text-center px-4 pb-4">
              {/* Icon */}
              <div
                className="d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--cream)',
                }}
              >
                <i className="bi bi-star" style={{ fontSize: '2rem', color: 'var(--pink)' }} />
              </div>

              <h4 className="fw-bold mb-2" style={{ color: 'var(--text-dark)' }}>
                {title}
              </h4>

              <p className="text-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                Creá una cuenta gratis y obtené <strong>1 semana de prueba</strong> sin necesidad
                de ingresar tarjeta ni datos de pago. Accedé a todas las herramientas sin límites.
              </p>

              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={() => { onClose(); navigate('/register'); }}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Crear cuenta gratis
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => { onClose(); navigate('/planes'); }}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  Ver planes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal-content {
          box-shadow: var(--shadow-lg);
        }
        .btn-close:focus {
          box-shadow: none;
        }
      `}</style>
    </>
  );
}

export default UpgradeModal;
