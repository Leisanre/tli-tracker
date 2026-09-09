export default function ResetSessionConfirm({ onContinue, onNewSession }) {
  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onContinue}
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          background: 'var(--bg-deep)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-5)',
        }}
      >
        <h2 style={{ fontSize: 15, margin: '0 0 8px 0' }}>Reset Session?</h2>
        <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: '0 0 var(--sp-4) 0' }}>
          Starting a new session closes the current one — it's saved to History and stays browsable, nothing is
          deleted.
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
          <button onClick={onContinue}>Continue Current Session</button>
          <button className="primary" onClick={onNewSession}>
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
