const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const screenshotService = require('./screenshotService');

let mainWindow;
let tray;

function createTray() {
  // Simple red square icon as default
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADVJREFUOE9j/P//PwM1AecYGRj+45NHV4vTjFQD6BrQ2XAYDRiMAlAwGAWjYDAKBpIBA9mAgWwAAH+XHSFr68vDAAAAAElFTkSuQmCC');
  
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      } 
    },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Checkout Team Logger');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const frontendUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

  mainWindow.loadURL(frontendUrl);

  // Poll localStorage for token to start screenshot service
  let lastToken = null;
  const checkToken = async () => {
    try {
      const token = await mainWindow.webContents.executeJavaScript('localStorage.getItem("team-logger-token")');
      if (token && token !== lastToken) {
        console.log('Token found in localStorage, starting screenshot service');
        lastToken = token;
        screenshotService.startScreenshotService(token);
      } else if (!token && lastToken) {
        console.log('Token removed from localStorage, stopping screenshot service');
        lastToken = null;
        screenshotService.stopScreenshotService();
      }
    } catch (e) {
      // In case webContents is not ready or fails
    }
  };

  // Check every 10 seconds if token exists or has changed
  setInterval(checkToken, 10000);

  // Minimize behavior: Hide to tray
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Handle close to hide to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    screenshotService.stopScreenshotService();
  });
}

app.whenReady().then(() => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (app.isQuitting) {
      app.quit();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Handle manual token update if future communication is added
ipcMain.on('set-token', (event, token) => {
  if (token) {
    screenshotService.startScreenshotService(token);
  } else {
    screenshotService.stopScreenshotService();
  }
});
