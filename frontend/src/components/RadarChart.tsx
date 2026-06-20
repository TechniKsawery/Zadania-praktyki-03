import React from 'react';

interface RadarChartProps {
  technique: number;
  speed: number;
  physicality: number;
  creativity: number;
  mentality: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  technique,
  speed,
  physicality,
  creativity,
  mentality,
}) => {
  const size = 300;
  const center = size / 2;
  const maxVal = 20;
  const radius = 100; // max value radius

  const stats = [
    { label: 'Technika', value: technique },
    { label: 'Szybkość', value: speed },
    { label: 'Fizyczność', value: physicality },
    { label: 'Kreatywność', value: creativity },
    { label: 'Mentalność', value: mentality },
  ];

  // Get X, Y coordinates for a value on axis i
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2; // offset -90deg to start at top
    const valPercent = value / maxVal;
    const r = radius * valPercent;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Outer grid lines
  const gridLevels = [5, 10, 15, 20];

  // Helper to generate pentagon points for a given value level
  const getPentagonPoints = (level: number) => {
    return Array.from({ length: 5 })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Polygon points for the player's values
  const playerPoints = stats
    .map((s, i) => {
      const { x, y } = getCoordinates(i, s.value);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Definitions for gradients */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 245, 155, 0.4)" />
            <stop offset="100%" stopColor="rgba(0, 245, 155, 0)" />
          </radialGradient>
        </defs>

        {/* Circular background glow */}
        <circle cx={center} cy={center} r={radius} fill="url(#radarGlow)" />

        {/* Pentagon Grid Levels */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={getPentagonPoints(level)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Web Axis Lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const outerCoord = getCoordinates(i, maxVal);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerCoord.x}
              y2={outerCoord.y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Filled Player Performance Area */}
        <polygon
          points={playerPoints}
          fill="rgba(0, 245, 155, 0.25)"
          stroke="var(--accent-color)"
          strokeWidth="2.5"
        />

        {/* Draw points on vertices */}
        {stats.map((s, i) => {
          const { x, y } = getCoordinates(i, s.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#080b10"
                stroke="var(--accent-color)"
                strokeWidth="2"
              />
              {/* Text label with custom offsets */}
              {(() => {
                const labelAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const offset = 18;
                const lx = center + (radius + offset) * Math.cos(labelAngle);
                const ly = center + (radius + offset) * Math.sin(labelAngle) + 4; // Adjust vertical align
                
                let textAnchor: 'inherit' | 'end' | 'start' | 'middle' = 'middle';
                if (Math.cos(labelAngle) > 0.1) textAnchor = 'start';
                if (Math.cos(labelAngle) < -0.1) textAnchor = 'end';

                return (
                  <text
                    x={lx}
                    y={ly}
                    fill="var(--text-secondary)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-title)"
                    textAnchor={textAnchor as any}
                  >
                    {s.label} ({s.value})
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
