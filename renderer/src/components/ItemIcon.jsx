import { typeColorVar } from '../utils/itemType.js';

// Type-accent glow — lets the eye scan a loot list for currency/gear/memory without
// reading the type column; kept subtle so it doesn't compete with the icon art.
export default function ItemIcon({ item, size = 40 }) {
  const glow = item ? typeColorVar(item.typeCn) : null;
  const glowStyle = glow ? { boxShadow: `0 0 8px 1px color-mix(in srgb, ${glow} 45%, transparent)` } : {};

  if (!item || !item.icon) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: 'var(--bg-3)',
          borderRadius: 'var(--radius-sm)',
          ...glowStyle,
        }}
      />
    );
  }
  return (
    <img
      src={item.icon}
      alt={item.name}
      width={size}
      height={size}
      loading="lazy"
      style={{
        borderRadius: 'var(--radius-sm)',
        objectFit: 'contain',
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)',
        ...glowStyle,
      }}
    />
  );
}
