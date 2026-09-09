export default function Sparkline({ points, color = '#5b8def', height = 32 }) {
  if (points.length < 2) return <div style={{ height }} />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 100;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = `M0,${height} L${coords} L${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={areaPath} fill={color} opacity="0.12" />
    </svg>
  );
}
