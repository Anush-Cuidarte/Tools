import { useState, useRef, useCallback, useContext } from 'react';
import BreastDiagram from '../components/BreastDiagram';
import UpgradeModal from '../components/UpgradeModal';
import useExport from '../hooks/useExport';
import { useAuth } from '../services/auth';
import { DemoContext } from '../services/demo';
import api from '../services/api';

let pointIdCounter = 0;

function NippleLesion() {
  // ── State ──
  const [points, setPoints] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [popupPos, setPopupPos] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  const resultsRef = useRef(null);
  const { exportToPng } = useExport();
  const { user } = useAuth();
  const demo = useContext(DemoContext); // null if authed (no DemoProvider)
  const isDemo = !user && !!demo;

  const selected = selectedIndex !== null ? points[selectedIndex] : null;

  // ── SVG click: add marker ──
  const handleCanvasClick = useCallback((x, y, breast) => {
    if (isDemo && demo && !demo.consumeCalculation('nipple-lesion')) {
      return; // limit reached, UpgradeModal will show
    }
    const newPoint = {
      id: ++pointIdCounter,
      number: nextNumber,
      x: Math.round(x),
      y: Math.round(y),
      breast,
      description: '',
      image: null, // data URL
    };
    setPoints((prev) => [...prev, newPoint]);
    setNextNumber((n) => n + 1);
    setSelectedIndex(points.length); // select the newly added point
  }, [nextNumber, points.length, isDemo, demo]);

  // ── Point selection ──
  const handlePointClick = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  // ── Hover popup ──
  const handlePointHover = useCallback((number, e) => {
    setHoveredPoint(number);
    setPopupPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointMove = useCallback((number, e) => {
    if (hoveredPoint === number) {
      setPopupPos({ x: e.clientX, y: e.clientY });
    }
  }, [hoveredPoint]);

  const handlePointLeave = useCallback(() => {
    setHoveredPoint(null);
    setPopupPos(null);
  }, []);

  // ── Point editing ──
  const updateDescription = useCallback((value) => {
    if (selectedIndex === null) return;
    setPoints((prev) => {
      const next = [...prev];
      next[selectedIndex] = { ...next[selectedIndex], description: value };
      return next;
    });
  }, [selectedIndex]);

  const handleImageUpload = useCallback((e) => {
    if (selectedIndex === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPoints((prev) => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], image: dataUrl };
        return next;
      });
    };
    reader.readAsDataURL(file);
  }, [selectedIndex]);

  const removeImage = useCallback(() => {
    if (selectedIndex === null) return;
    setPoints((prev) => {
      const next = [...prev];
      next[selectedIndex] = { ...next[selectedIndex], image: null };
      return next;
    });
  }, [selectedIndex]);

  const deletePoint = useCallback(() => {
    if (selectedIndex === null) return;
    setPoints((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  }, [selectedIndex]);

  const reset = useCallback(() => {
    setPoints([]);
    setNextNumber(1);
    setSelectedIndex(null);
    setHoveredPoint(null);
    setPopupPos(null);
    setPatientName('');
    setNotes('');
    pointIdCounter = 0;
  }, []);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!resultsRef.current || points.length === 0) return;
    if (isDemo && demo && !demo.consumeExport('nipple-lesion')) {
      return; // limit reached, UpgradeModal will show
    }
    const exportOpts = isDemo ? { demo: true, anonymousId: demo?.deviceId } : {};
    api.registrarExport('nipple-lesion', exportOpts).catch(() => {});
    exportToPng(resultsRef.current, isDemo ? 'registro-lesiones-pezon-demo' : 'registro-lesiones-pezon');
  }, [points, exportToPng, isDemo, demo]);

  // ── Helpers ──
  const breastLabel = (b) => (b === 'left' ? 'Izquierdo' : 'Derecho');
  const leftPoints = points.filter((p) => p.breast === 'left');
  const rightPoints = points.filter((p) => p.breast === 'right');
  const hasPoints = points.length > 0;

  // Popup content for hovered marker
  const hoveredPointData = hoveredPoint ? points.find((p) => p.number === hoveredPoint) : null;

  return (
    <div className="container" style={{ maxWidth: 'var(--max-width)' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <h1 className="mb-2" style={{ color: 'var(--text-dark)' }}>
            Registro de Lesiones en Pezón
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem', maxWidth: 600 }}>
            Hacé clic sobre los diagramas para marcar lesiones en el pezón/areola.
            Cada marca es numerada automáticamente. Completá la descripción y agregá una foto opcional para cada lesión.
          </p>

          {/* Demo banner */}
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
        {/* ========== FORMULARIO (col-izquierda) ========== */}
        <div className="col-12 col-lg-5">
          <div className="d-flex flex-column gap-4">
            {/* ── Paciente ── */}
            <div className="card p-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                <i className="bi bi-person me-2" style={{ color: 'var(--pink)' }}></i>
                Paciente
              </h5>
              <div className="mb-2">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre de la paciente"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                  Notas
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Notas adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* ── Editor de lesión seleccionada ── */}
            {selected && (
              <div className="card p-4 fade-in">
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                  <span
                    className="badge me-2"
                    style={{ background: 'var(--pink)', fontSize: '0.85rem', padding: '4px 12px' }}
                  >
                    #{selected.number}
                  </span>
                  Lesión - {breastLabel(selected.breast)}
                </h5>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                    Descripción
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describí la lesión (color, tamaño, forma, etc.)"
                    value={selected.description}
                    onChange={(e) => updateDescription(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                    Foto {selected.image ? '(1 adjunta)' : '(opcional)'}
                  </label>
                  {selected.image ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={selected.image}
                        alt={`Lesión #${selected.number}`}
                        className="rounded"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1"
                        onClick={removeImage}
                        style={{ borderRadius: '50%', width: 28, height: 28, padding: 0, lineHeight: 1 }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={handleImageUpload}
                      />
                      <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                        PNG o JPG. Se almacena localmente en la sesión.
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={deletePoint}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  <i className="bi bi-trash3 me-2"></i>
                  Eliminar lesión #{selected.number}
                </button>
              </div>
            )}

            {/* ── Resumen de puntos ── */}
            <div className="card p-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                <i className="bi bi-list-ul me-2" style={{ color: 'var(--pink)' }}></i>
                Lesiones registradas
                {hasPoints && (
                  <span className="badge ms-2" style={{ background: 'var(--pink)', fontWeight: 600 }}>
                    {points.length}
                  </span>
                )}
              </h5>

              {!hasPoints ? (
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Todavía no hay lesiones marcadas. Hacé clic en los diagramas para comenzar.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {points.map((point, index) => (
                    <div
                      key={point.id}
                      className={`point-summary-item d-flex align-items-center gap-2 p-2 rounded ${
                        selectedIndex === index ? 'point-summary-active' : ''
                      }`}
                      onClick={() => handlePointClick(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePointClick(index); }}
                    >
                      <span
                        className="badge"
                        style={{
                          background: selectedIndex === index ? 'var(--pink-dark)' : 'var(--pink)',
                          minWidth: 28,
                          fontSize: '0.8rem',
                        }}
                      >
                        #{point.number}
                      </span>
                      <div className="flex-grow-1" style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                        <div className="fw-semibold" style={{ color: 'var(--text-dark)' }}>
                          {breastLabel(point.breast)}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {point.description
                            ? point.description.length > 50
                              ? point.description.slice(0, 50) + '...'
                              : point.description
                            : 'Sin descripción'}
                        </div>
                      </div>
                      {point.image && (
                        <i className="bi bi-image" style={{ color: 'var(--green)', fontSize: '1rem' }}></i>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hasPoints && (
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 mt-3"
                  onClick={reset}
                  style={{ borderColor: '#e0e0e0', color: 'var(--text-body)', borderRadius: 'var(--radius-full)' }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Limpiar todo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========== DIAGRAMAS (col-derecha) — SIEMPRE VISIBLES ========== */}
        <div className="col-12 col-lg-7">
          <div ref={resultsRef} className="d-flex flex-column gap-3">
            {/* Patient info for export (solo si hay datos) */}
            {(patientName || notes) && (
              <div className="card p-3 export-patient-info">
                {patientName && (
                  <p className="mb-1 fw-semibold" style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                    <i className="bi bi-person me-1" style={{ color: 'var(--pink)' }}></i>
                    {patientName}
                  </p>
                )}
                {notes && (
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                    {notes}
                  </p>
                )}
              </div>
            )}

            {/* Diagrams row — SIEMPRE visible */}
            <div className="card p-4">
              <h5 className="fw-bold mb-3 text-center" style={{ color: 'var(--text-dark)' }}>
                Diagramas de Mama
              </h5>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <BreastDiagram
                    breast="left"
                    points={points}
                    onCanvasClick={handleCanvasClick}
                    onPointClick={handlePointClick}
                    onPointHover={handlePointHover}
                    onPointLeave={handlePointLeave}
                    onPointMove={handlePointMove}
                    hoveredPoint={hoveredPoint}
                    selectedIndex={selectedIndex}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <BreastDiagram
                    breast="right"
                    points={points}
                    onCanvasClick={handleCanvasClick}
                    onPointClick={handlePointClick}
                    onPointHover={handlePointHover}
                    onPointLeave={handlePointLeave}
                    onPointMove={handlePointMove}
                    hoveredPoint={hoveredPoint}
                    selectedIndex={selectedIndex}
                  />
                </div>
              </div>
            </div>

            {/* Lesions detail list (for export, solo si hay puntos) */}
            {hasPoints && (
              <div className="card p-4 export-lesions-detail">
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                  Detalle de lesiones
                </h5>
                <div className="d-flex flex-column gap-2">
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className="d-flex align-items-start gap-3 p-2 rounded"
                      style={{ background: 'var(--bg)' }}
                    >
                      <span
                        className="badge flex-shrink-0 mt-1"
                        style={{ background: 'var(--pink)', minWidth: 28, fontSize: '0.8rem' }}
                      >
                        #{point.number}
                      </span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                          {breastLabel(point.breast)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
                          {point.description || 'Sin descripción'}
                        </div>
                      </div>
                      {point.image && (
                        <img
                          src={point.image}
                          alt={`Lesión #${point.number}`}
                          className="rounded flex-shrink-0"
                          style={{ width: 48, height: 48, objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export button */}
          {hasPoints && (
            <div className="mt-3 text-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
              >
                <i className="bi bi-download me-2"></i>
                Exportar registro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== HOVER POPUP ========== */}
      {hoveredPointData && popupPos && (
        <div
          className="point-popup"
          style={{
            position: 'fixed',
            left: popupPos.x + 16,
            top: popupPos.y - 10,
            zIndex: 9999,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="card p-3" style={{ boxShadow: 'var(--shadow-lg)', border: '1.5px solid var(--cream)', borderRadius: 'var(--radius-md)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge" style={{ background: 'var(--pink)' }}>
                #{hoveredPointData.number}
              </span>
              <span className="fw-semibold" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {breastLabel(hoveredPointData.breast)}
              </span>
            </div>
            {hoveredPointData.description && (
              <p className="mb-2" style={{ fontSize: '0.85rem', color: 'var(--text-body)', maxWidth: 200 }}>
                {hoveredPointData.description}
              </p>
            )}
            {hoveredPointData.image && (
              <div
                className="rounded overflow-hidden"
                style={{ width: 120, height: 120 }}
              >
                <img
                  src={hoveredPointData.image}
                  alt={`Lesión #${hoveredPointData.number}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== UPGRADE MODAL = límite alcanzado ========== */}
      {isDemo && demo && (
        <UpgradeModal
          show={demo.showUpgrade}
          blockedAction={demo.blockedAction}
          onClose={() => demo.setShowUpgrade(false)}
        />
      )}

      {/* ========== DEMO INFO MODAL = al clickear badge ========== */}
      <UpgradeModal
        show={showDemoInfo}
        onClose={() => setShowDemoInfo(false)}
        title="Estás usando la versión demo"
      />

      {/* ========== SCOPED STYLES ========== */}
      <style>{`
        .point-summary-item {
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .point-summary-item:hover {
          background: var(--cream) !important;
        }
        .point-summary-active {
          background: #F5E6E8 !important;
          border: 1.5px solid var(--pink-light);
        }
        .point-popup {
          pointer-events: none;
          animation: fadeIn 0.15s ease;
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

export default NippleLesion;
