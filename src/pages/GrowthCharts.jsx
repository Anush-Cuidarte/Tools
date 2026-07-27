import { useState, useRef, useMemo, useCallback, useContext } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  whoBoysWeight, whoGirlsWeight, PERCENTILE_LABELS, estimatePercentile,
} from '../data/who-growth';
import UpgradeModal from '../components/UpgradeModal';
import useExport from '../hooks/useExport';
import { useAuth } from '../services/auth';
import { DemoContext } from '../services/demo';
import api from '../services/api';

const GENDER_OPTIONS = [
  { value: 'boy', label: 'Niño', icon: 'bi-gender-male' },
  { value: 'girl', label: 'Niña', icon: 'bi-gender-female' },
];

const CHART_COLORS = [
  '#D4EDE0', '#A8D5BA', '#E9D5C8', '#C97B84', '#E9B4BB', '#B8C8DF', '#D4C8ED',
];

function formatAge(months) {
  const m = Math.floor(months);
  const d = Math.round((months - m) * 30);
  if (m === 0 && d === 0) return '0 meses';
  if (m === 0) return `${d} días`;
  if (d === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  return `${m} ${m === 1 ? 'mes' : 'meses'}, ${d} días`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;

  const babyPoint = payload.find(p => p.dataKey === 'babyWeight');
  const percentileLines = payload.filter(p => p.dataKey !== 'babyWeight');

  return (
    <div className="card p-3 shadow-sm" style={{ fontSize: '0.85rem', minWidth: 160 }}>
      <div className="fw-bold mb-2" style={{ color: 'var(--text-dark)' }}>
        {formatAge(label)}
      </div>
      {percentileLines.map((entry, i) => (
        <div key={i} className="d-flex justify-content-between gap-3">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="fw-semibold">{Number(entry.value).toFixed(2)} kg</span>
        </div>
      ))}
      {babyPoint && (
        <>
          <hr className="my-1" />
          <div className="d-flex justify-content-between gap-3">
            <span style={{ color: '#A85D66', fontWeight: 700 }}>
              <i className="bi bi-star-fill me-1" style={{ fontSize: '0.7rem' }}></i>
              Tu bebé
            </span>
            <span className="fw-bold">{Number(babyPoint.value).toFixed(2)} kg</span>
          </div>
        </>
      )}
    </div>
  );
}

function renderLegend(props) {
  const { payload } = props;
  return (
    <ul className="list-unstyled d-flex flex-wrap justify-content-center gap-2 mt-2 mb-0">
      {payload.map((entry, index) => (
        <li
          key={index}
          className="d-flex align-items-center gap-1"
          style={{ fontSize: '0.75rem', cursor: 'pointer' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: entry.value === 'Tu bebé' ? 12 : 3,
              borderRadius: entry.value === 'Tu bebé' ? '50%' : 2,
              background: entry.color,
            }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

function GrowthCharts() {
  const [gender, setGender] = useState('boy');
  const [measurements, setMeasurements] = useState([]);
  const [newMonth, setNewMonth] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const { exportToPng } = useExport();
  const { user } = useAuth();
  const demo = useContext(DemoContext);
  const isDemo = !user && !!demo;

  // Build chart data: base percentile rows + baby measurement rows
  const chartData = useMemo(() => {
    const baseData = gender === 'boy' ? whoBoysWeight : whoGirlsWeight;
    const data = baseData.map(row => ({ ...row, babyWeight: null }));

    measurements.forEach(m => {
      const age = m.month + (m.day || 0) / 30;
      const existing = data.find(d => Math.abs(d.month - age) < 0.001);
      if (existing) {
        existing.babyWeight = m.weight;
      } else {
        data.push({ month: age, babyWeight: m.weight });
      }
    });

    return data.sort((a, b) => a.month - b.month);
  }, [gender, measurements]);

  const addMeasurement = () => {
    if (isDemo && demo && !demo.consumeCalculation('growth-charts')) {
      return;
    }

    const month = parseInt(newMonth, 10) || 0;
    const day = parseInt(newDay, 10) || 0;
    const weight = parseFloat(newWeight);
    const ageMonths = month + day / 30;

    if (isNaN(weight) || month < 0 || month > 24 || day < 0 || day > 30 || weight <= 0) return;
    if (month === 0 && day === 0) return;
    if (month === 24 && day > 0) return;

    setMeasurements(prev => {
      const updated = [...prev, { month, day, weight, id: Date.now(), ageMonths }];
      return updated.sort((a, b) => a.ageMonths - b.ageMonths);
    });
    setNewMonth('');
    setNewDay('');
    setNewWeight('');
  };

  const removeMeasurement = useCallback((id) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleExport = useCallback(async () => {
    if (isDemo && demo && !demo.consumeExport('growth-charts')) {
      return;
    }
    const exportOpts = isDemo ? { demo: true, anonymousId: demo?.deviceId } : {};
    api.registrarExport('growth-charts', exportOpts).catch(() => {});
    const el = document.getElementById('growth-chart-card');
    if (el) exportToPng(el, isDemo ? 'curvas-crecimiento-demo' : 'curvas-crecimiento');
  }, [exportToPng, isDemo, demo]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addMeasurement();
  };

  const clearAll = () => {
    setMeasurements([]);
  };

  return (
    <div className="container" style={{ maxWidth: 'var(--max-width)' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <h1 className="mb-2" style={{ color: 'var(--text-dark)' }}>
            Curvas de Crecimiento
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem', maxWidth: 600 }}>
            Visualizá las curvas percentilares OMS y registrá las mediciones de peso de tu bebé.
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

      {/* Selector de género */}
      <div className="d-flex gap-2 mb-4 justify-content-center">
        {GENDER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`toggle-btn d-flex align-items-center gap-2 px-4 ${
              gender === opt.value ? 'toggle-btn-active' : ''
            }`}
            onClick={() => setGender(opt.value)}
          >
            <i className={`bi ${opt.icon}`}></i>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div id="growth-chart-card">
        <div className="card p-3 p-md-4 mb-4">
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                label={{ value: 'Edad (meses)', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#999' } }}
                tick={{ fontSize: 11, fill: '#999' }}
                domain={[0, 24]}
                ticks={[0, 2, 4, 6, 9, 12, 15, 18, 21, 24]}
                allowDataOverflow={false}
              />
              <YAxis
                label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#999' } }}
                tick={{ fontSize: 11, fill: '#999' }}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />

              {/* Líneas percentilares */}
              {PERCENTILE_LABELS.map((p, i) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  name={p}
                  stroke={CHART_COLORS[i]}
                  strokeWidth={p === 'P50' ? 2 : 1.2}
                  strokeDasharray={p === 'P50' ? 'none' : '5 3'}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}

              {/* Línea del bebé (solo si hay 2+ mediciones) */}
              {measurements.length >= 2 && (
                <Line
                  type="monotone"
                  dataKey="babyWeight"
                  name="Tu bebé"
                  stroke="#A85D66"
                  strokeWidth={3}
                  dot={{ r: 4.5, fill: '#A85D66', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#A85D66', stroke: '#fff', strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
              )}

              {/* Punto único (1 medición) */}
              {measurements.length === 1 && (
                <Line
                  type="monotone"
                  dataKey="babyWeight"
                  name="Tu bebé"
                  stroke="#A85D66"
                  strokeWidth={3}
                  dot={{ r: 4.5, fill: '#A85D66', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mediciones */}
      <div className="row g-4">
        <div className="col-12 col-md-5">
          <div className="card p-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Agregar medición
            </h5>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                  Meses
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="0"
                  max="24"
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                  Días
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="0"
                  max="30"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                Peso <span className="text-muted fw-normal">(kg)</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 3.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="0"
                  step="0.01"
                />
                <span className="input-group-text" style={{ background: 'var(--cream)', border: '1.5px solid #e0e0e0' }}>kg</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={addMeasurement}
              disabled={!newWeight || (!newMonth && !newDay)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Agregar al gráfico
            </button>
          </div>
        </div>

        {/* Tabla de mediciones */}
        <div className="col-12 col-md-7">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>
                Mediciones registradas
                {measurements.length > 0 && (
                  <span className="badge ms-2" style={{ background: 'var(--pink)', fontSize: '0.7rem' }}>
                    {measurements.length}
                  </span>
                )}
              </h5>
              {measurements.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={clearAll}
                  style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                >
                  <i className="bi bi-trash me-1"></i>
                  Limpiar
                </button>
              )}
            </div>

            {measurements.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">
                <i className="bi bi-activity me-2"></i>
                No hay mediciones todavía. Agregá la primera arriba.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-borderless mb-0" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--cream)' }}>
                      <th className="text-muted fw-semibold">Edad</th>
                      <th className="text-muted fw-semibold">Peso (kg)</th>
                      <th className="text-muted fw-semibold">Percentil</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m) => {
                      const pct = estimatePercentile(m.weight, m.ageMonths, gender === 'boy');
                      const pctIdx = pct ? PERCENTILE_LABELS.indexOf(pct) : -1;
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                          <td className="fw-semibold">{formatAge(m.ageMonths)}</td>
                          <td className="fw-semibold">{m.weight.toFixed(2)}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: pctIdx >= 0 ? CHART_COLORS[pctIdx] : 'var(--text-muted)',
                                color: pctIdx >= 2 && pctIdx <= 5 ? 'var(--text-dark)' : 'white',
                              }}
                            >
                              {pct || '—'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => removeMeasurement(m.id)}
                              style={{ color: 'var(--danger)' }}
                              title="Eliminar"
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón exportar */}
      {measurements.length > 0 && (
        <div className="mt-4 text-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
          >
            <i className="bi bi-download me-2"></i>
            Exportar gráfico
          </button>
        </div>
      )}

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

export default GrowthCharts;
