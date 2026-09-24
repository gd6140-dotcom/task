import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo', badge }) {
  const colorMap = {
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)',
      text: '#818cf8',
      glow: 'rgba(99, 102, 241, 0.2)'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      text: '#34d399',
      glow: 'rgba(16, 185, 129, 0.2)'
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      text: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.2)'
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.25)',
      text: '#fb7185',
      glow: 'rgba(244, 63, 94, 0.2)'
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.25)',
      text: '#22d3ee',
      glow: 'rgba(6, 182, 212, 0.2)'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: scheme.bg,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: scheme.text
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
          {value}
        </span>
        {badge && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: scheme.bg,
              color: scheme.text,
              border: `1px solid ${scheme.border}`
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
