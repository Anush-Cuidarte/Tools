import { useRef, useContext, useEffect, useState, useCallback } from 'react';
import useGastricCalc from '../hooks/useGastricCalc';
import UpgradeModal from '../components/UpgradeModal';
import useExport from '../hooks/useExport';
import { useAuth } from '../services/auth';
import { DemoContext } from '../services/demo';
import api from '../services/api';

function ResultCard({ label, value, unit, color, big }) {
  return (
    <div className="result-card text-center p-3" style={{ borderColor: color || 'var(--pink)' }}>
      <div className={`result-value ${big ? 'result-value-big' : ''}`} style={{ color: color || 'var(--pink)' }}>
        {value ?? '—'}
      </div>
      <div className="result-label">{label}</div>
      {unit && <div className="result-unit">{unit}</div>}
      <style>{`
        .result-card {
          border: 1.5px solid var(--cream);
          border-top: 3px solid ${color || 'var(--pink)'};
          border-radius: var(--radius-md);
          background: var(--bg-card);
          height: 100%;
        }
        .result-value {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .result-value-big {
          font-size: 2.2rem;
        }
        .result-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-body);
          margin-top: 2px;
        }
        .result-unit {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

function ProgressBar({ pct, label, value, color }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{label}</span>
        <span className="fw-bold" style={{ color, fontSize: '0.9rem' }}>{value}</span>
      </div>
      <div className="progress" style={{ height: 12, borderRadius: 'var(--radius-full)', background: 'var(--cream)' }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({ pct, color, size = 100 }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--cream)" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="40" y="42" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>
        {Number.isFinite(pct) ? `${Math.round(pct)}%` : '—'}
      </text>
    </svg>
  );
}

function GastricCapacity() {
  const {
    pesoNacG, setPesoNacG,
    pesoActualG, setPesoActualG,
    modoML, setModoML,
    tomasFormula, setTomasFormula,
    mlPorToma, setMlPorToma,
    resultados,
    reset,
  } = useGastricCalc();

  const resultsRef = useRef(null);
  const { exportToPng } = useExport();
  const { user } = useAuth();
  const demo = useContext(DemoContext);
  const isDemo = !user && !!demo;
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const [blockCalcs, setBlockCalcs] = useState(false);

  // ── Debounce: raw input → sync to hook after 500ms idle ──
  const [rawPesoActualG, setRawPesoActualG] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setPesoActualG(rawPesoActualG), 500);
    return () => clearTimeout(timer);
  }, [rawPesoActualG, setPesoActualG]);

  // ── Consume demo calc on EVERY recalculation ──
  const hasResults = resultados !== null;
  const showResults = hasResults && !blockCalcs;
  useEffect(() => {
    if (resultados === null) return;
    if (isDemo && demo) {
      const allowed = demo.consumeCalculation('gastric-capacity');
      if (!allowed) {
        setBlockCalcs(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultados]);

  const handleReset = useCallback(() => {
    setRawPesoActualG('');
    reset();
    setBlockCalcs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    if (isDemo && demo && !demo.consumeExport('gastric-capacity')) {
      return;
    }
    const exportOpts = isDemo ? { demo: true, anonymousId: demo?.deviceId } : {};
    api.registrarExport('gastric-capacity', exportOpts).catch(() => {});
    if (resultsRef.current) {
      exportToPng(resultsRef.current, isDemo ? 'resumen-capacidad-gastrica-demo' : 'resumen-capacidad-gastrica');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 'var(--max-width)' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <h1 className="mb-2" style={{ color: 'var(--text-dark)' }}>
            Calculadora de Capacidad Gástrica
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem', maxWidth: 600 }}>
            Calculá la capacidad gástrica de tu bebé y la distribución entre leche materna y fórmula según sus pesos y tomas diarias.
          </p>

          {isDemo && demo && (
            <div
              className="d-inline-flex align-items-center gap-2 mb-4 px-3 py-2 rounded-pill demo-badge"
              onClick={() => setShowDemoInfo(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setShowDemoInfo(true); }}
            >
              <i className="bi bi-info-circle" style={{ color: 'var(--pink)' }}></i>
              <span className="text-muted">
                Modo demo — te quedan{' '}
                <strong>{demo.calcsRemaining} cálculos</strong> y{' '}
                <strong>{demo.exportsRemaining} exportaciones</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* === FORMULARIO === */}
        <div className="col-12 col-lg-5">
          <div className="card p-4 h-100">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>Datos del bebé</h5>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                Peso al nacer <span className="text-muted fw-normal">(gramos, opcional)</span>
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Ej: 3500"
                value={pesoNacG}
                onChange={(e) => setPesoNacG(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                Peso actual <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 3250"
                  value={rawPesoActualG}
                  onChange={(e) => setRawPesoActualG(e.target.value)}
                  min="0"
                  step="1"
                />
                <span className="input-group-text" style={{ background: 'var(--cream)', border: '1.5px solid #e0e0e0' }}>g</span>
              </div>
            </div>

            <hr className="my-3" />

            <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>Cálculo de capacidad</h5>

              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                  Modo de cálculo
                </label>
                <div className="toggle-group d-flex gap-2">
                  <button
                    type="button"
                    className={`toggle-btn flex-fill ${modoML === '150' ? 'toggle-btn-active' : ''}`}
                    onClick={() => setModoML('150')}
                  >
                    150 ml/kg/día
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn flex-fill ${modoML === '200' ? 'toggle-btn-active' : ''}`}
                    onClick={() => setModoML('200')}
                  >
                    200 ml/kg/día
                  </button>
                </div>
              </div>

            <hr className="my-3" />

            <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>Tomas de fórmula</h5>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                Tomas de fórmula al día
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Ej: 1"
                value={tomasFormula}
                onChange={(e) => setTomasFormula(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                ml por toma de fórmula
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Ej: 600"
                value={mlPorToma}
                onChange={(e) => setMlPorToma(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-2 btn-limpiar"
              onClick={handleReset}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* === RESULTADOS === */}
        <div className="col-12 col-lg-7">
          <div ref={resultsRef}>
            {!showResults ? (
              <div className="card p-5 text-center h-100 d-flex align-items-center justify-content-center">
                <i className="bi bi-calculator" style={{ fontSize: '3rem', color: 'var(--cream)', marginBottom: '1rem' }}></i>
                <p className="text-muted mb-0">
                  Ingresá el peso actual de tu bebé para ver los resultados
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {/* Pérdida de peso */}
                {resultados.perdidaPeso !== null && (
                  <div className="card p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ color: 'var(--text-dark)' }}>
                        Pérdida de peso desde el nacimiento
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: resultados.perdidaPesoColor,
                          fontSize: '1rem',
                          padding: '8px 16px',
                        }}
                      >
                        {resultados.perdidaPeso.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Capacidad gástrica */}
                <div className="card p-4">
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                    Capacidad Gástrica
                    <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.8rem' }}>
                      (peso: {resultados.pesoActualKg.toFixed(2)} kg)
                    </span>
                  </h5>
                  <div className="row g-2">
                    <div className="col-4">
                      <ResultCard label="150 ml/kg" value={resultados.cap150.toFixed(0)} unit="ml" color="var(--pink)" />
                    </div>
                    <div className="col-4">
                      <ResultCard label="200 ml/kg" value={resultados.cap200.toFixed(0)} unit="ml" color="var(--green)" />
                    </div>
                    <div className="col-4">
                      <ResultCard label="Promedio" value={resultados.capPromedio.toFixed(0)} unit="ml" color="var(--text-dark)" big />
                    </div>
                  </div>
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
                    Modo usado para distribución: <strong>{resultados.modoML} ml/kg/día</strong> — Capacidad de referencia: <strong>{resultados.capacidadRef.toFixed(0)} ml</strong>
                  </p>
                </div>

                {/* Distribución fórmula / teta */}
                <div className="card p-4">
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                    Distribución por día
                  </h5>

                  <div className="row g-4 align-items-center">
                    <div className="col-12 col-md-7">
                      <ProgressBar
                        label="Fórmula"
                        value={`${resultados.mlFormulaDia.toFixed(0)} ml (${resultados.pctFormula.toFixed(0)}%)`}
                        pct={resultados.pctFormula}
                        color="var(--green)"
                      />
                      <ProgressBar
                        label="Teta (leche materna)"
                        value={`${resultados.mlTetaDia.toFixed(0)} ml (${resultados.pctTeta.toFixed(0)}%)`}
                        pct={resultados.pctTeta}
                        color="var(--pink)"
                      />
                    </div>
                    <div className="col-12 col-md-5 d-flex flex-column align-items-center">
                      <DonutChart pct={resultados.pctFormula} color="var(--green)" />
                      <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                        Total: {resultados.capacidadRef.toFixed(0)} ml/día
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla resumen */}
                <div className="card p-4">
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                    Resumen de valores
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0" style={{ fontSize: '0.9rem' }}>
                      <tbody>
                        <tr>
                          <td className="text-muted">Peso al nacer</td>
                          <td className="fw-semibold text-end">{resultados.pesoNac > 0 ? `${resultados.pesoNac} g` : '—'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Peso actual</td>
                          <td className="fw-semibold text-end">{resultados.pesoActualG} g ({resultados.pesoActualKg.toFixed(2)} kg)</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Capacidad (150 ml/kg)</td>
                          <td className="fw-semibold text-end">{resultados.cap150.toFixed(0)} ml</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Capacidad (200 ml/kg)</td>
                          <td className="fw-semibold text-end">{resultados.cap200.toFixed(0)} ml</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid var(--cream)' }}>
                          <td className="text-muted fw-bold">Capacidad promedio</td>
                          <td className="fw-bold text-end" style={{ color: 'var(--pink)' }}>{resultados.capPromedio.toFixed(0)} ml</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Fórmula / día</td>
                          <td className="fw-semibold text-end">{resultados.mlFormulaDia.toFixed(0)} ml ({resultados.pctFormula.toFixed(0)}%)</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Teta / día</td>
                          <td className="fw-semibold text-end">{resultados.mlTetaDia.toFixed(0)} ml ({resultados.pctTeta.toFixed(0)}%)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón exportar */}
          {showResults && (
            <div className="mt-3 text-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
              >
                <i className="bi bi-download me-2"></i>
                Exportar resumen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal — límite alcanzado */}
      {isDemo && demo && (
        <UpgradeModal
          show={demo.showUpgrade}
          blockedAction={demo.blockedAction}
          onClose={() => demo.setShowUpgrade(false)}
        />
      )}

      {/* Demo Info Modal — al clickear el badge */}
      <UpgradeModal
        show={showDemoInfo}
        onClose={() => setShowDemoInfo(false)}
        title="Estás usando la versión demo"
      />

      <style>{`
        .btn-limpiar {
          border-color: #e0e0e0;
          color: var(--text-body);
          border-radius: var(--radius-full);
        }
        .btn-limpiar:hover {
          color: var(--text-body) !important;
          background: var(--cream) !important;
          border-color: #d0d0d0 !important;
        }
        .demo-badge {
          background: #EDD5D9;
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .demo-badge:hover {
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

export default GastricCapacity;
