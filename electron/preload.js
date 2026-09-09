const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tliApi', {
  minimizeWindow: () => ipcRenderer.invoke('win:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('win:toggleMaximize'),
  closeWindow: () => ipcRenderer.invoke('win:close'),
  getLogStatus: () => ipcRenderer.invoke('log:getStatus'),
  exportAllData: () => ipcRenderer.invoke('data:exportAll'),
  startWatching: (logPath) => ipcRenderer.invoke('log:start', logPath),
  stopWatching: () => ipcRenderer.invoke('log:stop'),
  onEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('log:event', listener);
    return () => ipcRenderer.removeListener('log:event', listener);
  },
  onLootUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('loot:update', listener);
    return () => ipcRenderer.removeListener('loot:update', listener);
  },
  onPlayerInfo: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('player:info', listener);
    return () => ipcRenderer.removeListener('player:info', listener);
  },
  resetSession: () => ipcRenderer.invoke('loot:resetSession'),
  getOverrides: () => ipcRenderer.invoke('catalog:getOverrides'),
  identifyItem: (rawItemId, catalogId) => ipcRenderer.invoke('catalog:identifyItem', rawItemId, catalogId),
  getRunHistory: (limit, sessionId) => ipcRenderer.invoke('history:getRuns', limit, sessionId),
  getItemDropStats: (itemId, sessionId) => ipcRenderer.invoke('history:getItemDropStats', itemId, sessionId),
  getRunLoot: (runId) => ipcRenderer.invoke('history:getRunLoot', runId),
  getRunCost: (runId) => ipcRenderer.invoke('history:getRunCost', runId),
  getSessions: (limit) => ipcRenderer.invoke('history:getSessions', limit),
  getAllPrices: () => ipcRenderer.invoke('price:getAll'),
  setManualPrice: (itemId, currencyId, price) => ipcRenderer.invoke('price:setManual', itemId, currencyId, price),
  onPriceUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('price:update', listener);
    return () => ipcRenderer.removeListener('price:update', listener);
  },
});
