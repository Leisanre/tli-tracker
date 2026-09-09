import ItemIcon from './ItemIcon.jsx';

// A brief celebratory toast + screen-edge glow for a high-value drop — positive
// feedback during a grind, without interrupting anything (auto-dismisses, no click
// required, doesn't block input).
export default function DropFlash({ flash }) {
  if (!flash) return null;
  return (
    <>
      <div
        aria-hidden="true"
        className="drop-flash-glow"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 140px 10px var(--ember-glow)',
          animation: 'drop-flash-pulse 2200ms var(--ease)',
        }}
      />
      <div
        className="glass dropdown-in"
        style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 91,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px',
          borderRadius: 999,
          boxShadow: '0 12px 32px -10px var(--ember-glow)',
        }}
      >
        <ItemIcon item={flash.item} size={28} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{flash.item ? flash.item.name : flash.itemId}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)' }}>
            +{flash.value.toFixed(1)} FE
          </div>
        </div>
      </div>
    </>
  );
}
