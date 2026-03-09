const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setToken: (token) => ipcRenderer.send('set-token', token),
});
