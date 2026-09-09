const { app, BrowserWindow, session, Menu, Tray, nativeImage } = require('electron');

// Taskbar/alt-tab name — the window itself has no OS-drawn title bar (frame: false),
// so this is the only place that text comes from outside the renderer's own <title>.
app.setName("Lei's TLI Tracker");

// No File/Edit/View/Window/Help bar — this is a custom-UI app, not a document editor.
Menu.setApplicationMenu(null);
const path = require('path');
const { registerIpcHandlers, stopTracking, isWatching } = require('./ipcHandlers');
const { buildSolidPng } = require('./trayIcon');

// Item icons come from cdn.tlidb.com, fronted by Cloudflare, which blocks:
//  1. Electron's default User-Agent (carries an "Electron/x.x.x" tag)
//  2. Any request missing a Referer of https://tlidb.com/ (hotlink protection)
// Fix both: present as plain Chrome, and inject the expected Referer for that host.
app.userAgentFallback =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let mainWindow;
let tray;
let quitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 1040,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Chromium throttles a window's JS timers when it's minimized/occluded — this is
      // a live tracker meant to keep running while the game is in the foreground, so
      // that throttling would freeze the "now" tick, stat recalculation, and the
      // auto-detect poll until the user restores the window. Keep it running at full
      // speed regardless of window state.
      backgroundThrottling: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }

  // Minimizing/restoring can leave the GPU compositor showing a stale or corrupted
  // frame on some Windows GPU drivers (visible as garbled/frozen UI after restore).
  // Nudging the window size by 1px and back forces a full relayout + repaint.
  mainWindow.on('restore', () => {
    const [w, h] = mainWindow.getSize();
    mainWindow.setSize(w + 1, h);
    setImmediate(() => mainWindow.setSize(w, h));
  });

  // Closing the window (the custom × button, Alt+F4) hides it instead of quitting —
  // tracking keeps running in the background via the tray icon, so price checks made
  // while playing still get logged without the dashboard open. Only the tray's actual
  // "Quit" stops it for real.
  mainWindow.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    mainWindow.hide();
  });

  registerIpcHandlers(mainWindow);
}

function createTray() {
  const icon = nativeImage.createFromBuffer(buildSolidPng(16, [255, 110, 199]));
  tray = new Tray(icon);
  tray.setToolTip("Lei's TLI Tracker");

  const rebuildMenu = () => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: isWatching() ? 'Watching…' : 'Idle', enabled: false },
        { type: 'separator' },
        { label: 'Show Dashboard', click: () => mainWindow.show() },
        {
          label: 'Quit',
          click: () => {
            quitting = true;
            app.quit();
          },
        },
      ]),
    );
  };
  rebuildMenu();
  setInterval(rebuildMenu, 5000); // cheap poll — good enough for a tray label, no IPC plumbing needed

  tray.on('click', () => mainWindow.show());
}

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://cdn.tlidb.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://tlidb.com/';
      callback({ requestHeaders: details.requestHeaders });
    },
  );
  // Icons fetched before this Referer fix existed may have cached a 403 to disk —
  // clear it once so those retry with the corrected headers instead of replaying the failure.
  await session.defaultSession.clearCache();
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  quitting = true;
  stopTracking();
});

app.on('window-all-closed', () => {
  // Windows are hidden, not destroyed, on close (see the 'close' handler above) — this
  // only fires on platforms/paths where a window is actually destroyed.
  if (process.platform !== 'darwin' && quitting) app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow.show();
});
