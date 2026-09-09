export default function StatToggles({
  taxOn,
  onToggleTax,
  feBasis,
  onChangeFeBasis,
  alertsOn,
  onToggleAlerts,
  alertThreshold,
  onChangeAlertThreshold,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 var(--sp-6) 8px' }}>
      <label
        className="glass"
        onClick={onToggleTax}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          borderRadius: 999,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            position: 'relative',
            width: 34,
            height: 19,
            borderRadius: 999,
            background: taxOn ? 'linear-gradient(120deg, var(--pink), var(--cyan))' : 'var(--bg-inset)',
            border: '1px solid var(--border)',
            flexShrink: 0,
            transition: 'background 200ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 1,
              left: taxOn ? 16 : 1,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 200ms cubic-bezier(.3,.8,.3,1)',
            }}
          />
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--fg-secondary)', fontWeight: 500 }}>
          Apply 12.5% Exchange tax to totals
        </span>
      </label>

      <div className="tab-group glass" role="group" aria-label="FE/Hour basis">
        <button type="button" data-active={feBasis === 'active'} onClick={() => onChangeFeBasis('active')}>
          Active Map Time
        </button>
        <button type="button" data-active={feBasis === 'wall'} onClick={() => onChangeFeBasis('wall')}>
          Wall Clock
        </button>
      </div>

      <label
        className="glass"
        onClick={onToggleAlerts}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          borderRadius: 999,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            position: 'relative',
            width: 34,
            height: 19,
            borderRadius: 999,
            background: alertsOn ? 'linear-gradient(120deg, var(--pink), var(--cyan))' : 'var(--bg-inset)',
            border: '1px solid var(--border)',
            flexShrink: 0,
            transition: 'background 200ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 1,
              left: alertsOn ? 16 : 1,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 200ms cubic-bezier(.3,.8,.3,1)',
            }}
          />
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--fg-secondary)', fontWeight: 500 }}>Drop alert ≥</span>
        <input
          type="number"
          min={1}
          value={alertThreshold}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChangeAlertThreshold(e.target.value)}
          style={{ width: 52, fontSize: 11.5, padding: '3px 6px' }}
        />
        <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>FE</span>
      </label>
    </div>
  );
}
