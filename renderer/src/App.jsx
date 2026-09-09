import { useEffect, useState } from 'react';
import SpaceBackground from './components/SpaceBackground.jsx';
import IconRail from './components/IconRail.jsx';
import PageHeader from './components/PageHeader.jsx';
import RunList from './components/RunList.jsx';
import SessionSidebar from './components/SessionSidebar.jsx';
import ItemPanel from './components/ItemPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import ResetSessionConfirm from './components/ResetSessionConfirm.jsx';
import StatCards from './components/StatCards.jsx';
import StatToggles from './components/StatToggles.jsx';
import SessionValueChart from './components/SessionValueChart.jsx';
import PriceDatabaseView from './components/PriceDatabaseView.jsx';
import ItemsView from './components/ItemsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import DropFlash from './components/DropFlash.jsx';
import { useTrackerState } from './hooks/useTrackerState.js';
import { useItemOverrides } from './hooks/useItemOverrides.js';
import { usePrices } from './hooks/usePrices.js';
import { useStatPreferences } from './hooks/useStatPreferences.js';
import { useSessionChart } from './hooks/useSessionChart.js';
import { useTheme } from './hooks/useTheme.js';
import { useDropAlerts } from './hooks/useDropAlerts.js';
import itemCatalog from '../../data/itemCatalog/items.json';

const catalogById = new Map(itemCatalog.map((i) => [i.id, i]));

export default function App() {
  const {
    status,
    events,
    currentMap,
    perMap,
    session,
    perMapCost,
    sessionCost,
    sessionStats,
    now,
    playerInfo,
    bag,
    stopWatching,
    resetSession,
  } = useTrackerState();
  const { overrides, identifyItem } = useItemOverrides();
  const { prices, priceHistory } = usePrices();
  const {
    taxOn,
    toggleTax,
    feBasis,
    changeFeBasis,
    feGoal,
    changeFeGoal,
    alertThreshold,
    changeAlertThreshold,
    alertsOn,
    toggleAlerts,
  } = useStatPreferences();
  const chartSamples = useSessionChart(session, sessionCost, prices, sessionStats, now, currentMap);
  const { palette, setPalette } = useTheme();
  const dropFlash = useDropAlerts(events, prices, catalogById, alertThreshold, alertsOn);

  const [runs, setRuns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null); // null = All Sessions
  const [selectedRunId, setSelectedRunId] = useState('live');
  const [selectedLoot, setSelectedLoot] = useState([]);
  const [selectedCost, setSelectedCost] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [view, setView] = useState('overview'); // 'overview' | 'prices'
  const [chartOpen, setChartOpen] = useState(false);

  const refetchSessions = () => window.tliApi.getSessions(100).then(setSessions);

  useEffect(() => {
    window.tliApi.getRunHistory(500, selectedSessionId).then(setRuns);
  }, [currentMap, selectedSessionId]);

  useEffect(() => {
    refetchSessions();
  }, [currentMap]);

  useEffect(() => {
    if (selectedRunId === 'live') return;
    // Clear immediately instead of leaving the previous run's items showing while the
    // fetch is in flight — otherwise clicking a new row can look like nothing happened.
    setSelectedLoot([]);
    setSelectedCost([]);
    let cancelled = false;
    Promise.all([window.tliApi.getRunLoot(selectedRunId), window.tliApi.getRunCost(selectedRunId)]).then(
      ([loot, cost]) => {
        if (cancelled) return; // a newer selection already superseded this fetch
        setSelectedLoot(loot.map((r) => ({ itemId: r.item_id, qty: r.qty })));
        setSelectedCost(cost.map((r) => ({ itemId: r.item_id, qty: r.qty })));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  const handleStartNewSession = async () => {
    setResetConfirmOpen(false);
    await resetSession();
    setSelectedSessionId(null);
    setSelectedRunId('live');
    refetchSessions();
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setSelectedRunId(sessionId === null ? 'live' : null);
  };

  const handleOpenSessionInMapLog = (sessionId) => {
    handleSelectSession(sessionId);
    setView('overview');
  };

  const VIEW_TITLES = { overview: 'Overview', items: 'Items', prices: 'Price Database', history: 'History' };

  const isLive = selectedRunId === 'live' && status.watching;
  const gainRows = isLive ? perMap : selectedLoot;
  const costRows = isLive ? perMapCost : selectedCost;
  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const mapLabel = isLive ? currentMap?.mapName : selectedRun?.map_name;

  return (
    <div className="relative flex h-screen" style={{ color: 'var(--fg-primary)' }}>
      <SpaceBackground />
      <DropFlash flash={dropFlash} />
      <IconRail
        view={view}
        onSetView={setView}
        watching={status.watching}
        onOpenSettings={() => setSettingsOpen(true)}
        playerInfo={playerInfo}
      />

      <div className="relative z-[1] flex flex-1 flex-col overflow-hidden">
        <PageHeader
          title={VIEW_TITLES[view]}
          view={view}
          status={status}
          currentMap={currentMap}
          onStop={stopWatching}
          onResetSession={() => setResetConfirmOpen(true)}
        />

        {view === 'overview' && (
          <>
            <StatToggles
              taxOn={taxOn}
              onToggleTax={toggleTax}
              feBasis={feBasis}
              onChangeFeBasis={changeFeBasis}
              alertsOn={alertsOn}
              onToggleAlerts={toggleAlerts}
              alertThreshold={alertThreshold}
              onChangeAlertThreshold={changeAlertThreshold}
            />
            <StatCards
              bag={bag}
              session={session}
              sessionCost={sessionCost}
              runs={runs}
              sessions={sessions}
              currentMap={currentMap}
              sessionStats={sessionStats}
              prices={prices}
              now={now}
              taxOn={taxOn}
              feBasis={feBasis}
              feGoal={feGoal}
              onChangeGoal={changeFeGoal}
            />
          </>
        )}

        {settingsOpen && (
          <SettingsPanel palette={palette} onSetPalette={setPalette} onClose={() => setSettingsOpen(false)} />
        )}

        {resetConfirmOpen && (
          <ResetSessionConfirm onContinue={() => setResetConfirmOpen(false)} onNewSession={handleStartNewSession} />
        )}

        {!status.watching && (
          <div
            className="mx-8 mb-2 flex items-center gap-2 rounded-2xl px-4 py-2 text-xs"
            style={{ background: 'rgba(102, 242, 214, 0.1)', color: 'var(--cyan)', border: '1px solid rgba(102, 242, 214, 0.25)' }}
          >
            {status.autoDetected ? 'Game log found — starting automatically…' : 'Waiting for Torchlight: Infinite to be found…'}
          </div>
        )}

        <div key={view} className="view-fade flex flex-1 flex-col overflow-hidden" style={{ minHeight: 0 }}>
        {view === 'overview' ? (
          <>
            <div className="flex flex-1 overflow-hidden px-10 pb-6" style={{ minHeight: 0 }}>
              <div className="glass flex flex-1 overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', minHeight: 0 }}>
                <SessionSidebar sessions={sessions} selectedSessionId={selectedSessionId} onSelect={handleSelectSession} />
                <RunList
                  runs={runs}
                  selectedSessionId={selectedSessionId}
                  currentMap={currentMap}
                  perMap={perMap}
                  perMapCost={perMapCost}
                  now={now}
                  watching={status.watching}
                  prices={prices}
                  selectedRunId={selectedRunId}
                  onSelect={setSelectedRunId}
                  catalogById={catalogById}
                />
                <ItemPanel
                  catalogById={catalogById}
                  catalogList={itemCatalog}
                  overrides={overrides}
                  onIdentify={identifyItem}
                  prices={prices}
                  priceHistory={priceHistory}
                  gainRows={gainRows}
                  costRows={costRows}
                  mapLabel={mapLabel}
                  sessionId={selectedSessionId}
                />
              </div>
            </div>
            <div className="px-10 pb-3">
              <button
                type="button"
                className="glass"
                onClick={() => setChartOpen((o) => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  color: 'var(--fg-secondary)',
                  textAlign: 'left',
                }}
              >
                Session Value Chart
                <span style={{ marginLeft: 'auto', color: 'var(--fg-muted)', fontSize: 10 }}>{chartOpen ? '▴ hide' : '▾ show'}</span>
              </button>
              {chartOpen && (
                <div style={{ marginTop: 8 }}>
                  <SessionValueChart samples={chartSamples} />
                </div>
              )}
            </div>
          </>
        ) : view === 'items' ? (
          <ItemsView bag={bag} catalogById={catalogById} prices={prices} />
        ) : view === 'history' ? (
          <HistoryView sessions={sessions} onOpenSession={handleOpenSessionInMapLog} />
        ) : (
          <PriceDatabaseView
            catalog={itemCatalog}
            prices={prices}
            currencyId={Object.values(prices)[0]?.currency_id}
            currencyName={catalogById.get(Object.values(prices)[0]?.currency_id)?.name}
            onSetManualPrice={(itemId, currencyId, price) => window.tliApi.setManualPrice(itemId, currencyId, price)}
          />
        )}
        </div>
      </div>
    </div>
  );
}
