import { useRef } from 'react';

function BreastDiagram({ breast, points, onCanvasClick, onPointClick, onPointHover, onPointLeave, onPointMove, hoveredPoint, selectedIndex }) {
  const svgRef = useRef(null);

  const isLeft = breast === 'left';
  const label = isLeft ? 'IZQUIERDO' : 'DERECHO';
  // Schematic front-view breast — round oval shape, natural proportions
  const viewBox = [0, 0, 200, 200];
  // Areola / nipple position (slightly below center)
  const nippleX = 100;
  const nippleY = 90;

  // Symmetrical rounded oval — wider at top, gently curved bottom
  const breastPath = 'M28,48 C28,12 172,12 172,48 C172,122 156,178 100,178 C44,178 28,122 28,48Z';

  const handleClick = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewBox[2];
    const y = ((e.clientY - rect.top) / rect.height) * viewBox[3];
    onCanvasClick(x, y, breast);
  };

  const thisPoints = points.filter((p) => p.breast === breast);

  return (
    <div className="breast-diagram-wrapper">
      <svg
        ref={svgRef}
        viewBox={viewBox.join(' ')}
        className="breast-svg"
        onClick={handleClick}
        style={{ cursor: 'crosshair' }}
      >
        {/* Filters */}
        <defs>
          <filter id={`shadow-${breast}`} x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C97B84" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={viewBox[2]} height={viewBox[3]} fill="var(--bg-card)" rx="12" />

        {/* Breast outline with visible fill + shadow */}
        <path
          d={breastPath}
          fill="var(--cream)"
          stroke="var(--pink-light)"
          strokeWidth="2.5"
          filter={`url(#shadow-${breast})`}
        />

        {/* Areola */}
        <ellipse cx={nippleX} cy={nippleY} rx="18" ry="14" fill="var(--pink-light)" opacity="0.5" />

        {/* Nipple */}
        <circle cx={nippleX} cy={nippleY} r="5" fill="var(--pink)" />

        {/* Side label */}
        <text x={viewBox[2] / 2} y="192" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600">
          {label}
        </text>

        {/* Markers */}
        {thisPoints.map((point, i) => {
          const index = points.indexOf(point);
          const isSelected = selectedIndex === index;
          const isHovered = hoveredPoint === point.number;
          return (
            <g
              key={point.id}
              className="breast-marker"
              onClick={(e) => { e.stopPropagation(); onPointClick(index); }}
              onMouseEnter={(e) => onPointHover(point.number, e)}
              onMouseMove={(e) => onPointMove(point.number, e)}
              onMouseLeave={() => onPointLeave()}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer ring feedback */}
              {(isSelected || isHovered) && (
                <circle cx={point.x} cy={point.y} r="14" fill="none" stroke="var(--pink)" strokeWidth="2" opacity="0.4" />
              )}
              {/* Marker circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill={isSelected ? 'var(--pink-dark)' : 'var(--pink)'}
                stroke="white"
                strokeWidth="2.5"
              />
              {/* Number */}
              <text
                x={point.x}
                y={point.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="10"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
              >
                {point.number}
              </text>
            </g>
          );
        })}

        {/* Empty state hint */}
        {thisPoints.length === 0 && (
          <text x={viewBox[2] / 2} y={viewBox[3] / 2 + 20} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontStyle="italic">
            Hacé clic para marcar
          </text>
        )}
      </svg>

      <style>{`
        .breast-diagram-wrapper {
          width: 100%;
          max-width: 260px;
          margin: 0 auto;
        }
        .breast-svg {
          width: 100%;
          height: auto;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s ease;
        }
        .breast-svg:hover {
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}

export default BreastDiagram;
