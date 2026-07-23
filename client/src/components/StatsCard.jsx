// Color configs — all designed for light (cream) background
const colorMap = {
  primary: {
    bg: 'rgba(13,122,138,0.12)',
    border: 'rgba(13,122,138,0.25)',
    iconColor: '#0d7a8a',
    valueBg: 'rgba(13,122,138,0.08)',
  },
  emerald: {
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.22)',
    iconColor: '#047857',
    valueBg: 'rgba(16,185,129,0.07)',
  },
  amber: {
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.22)',
    iconColor: '#b45309',
    valueBg: 'rgba(217,119,6,0.07)',
  },
  blue: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.22)',
    iconColor: '#1d4ed8',
    valueBg: 'rgba(59,130,246,0.07)',
  },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'primary' }) {
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="card-hover p-5 flex items-start gap-4">
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
      >
        <span style={{ color: c.iconColor }}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <p className="text-sm font-medium truncate" style={{ color: '#4a8f9e' }}>
          {title}
        </p>
        {/* Value */}
        <p className="text-2xl font-bold mt-0.5 truncate" style={{ color: '#0d3d4a' }}>
          {value}
        </p>
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs mt-1 truncate" style={{ color: '#6ab3c0' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
