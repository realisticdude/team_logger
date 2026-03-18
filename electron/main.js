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

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    console.log('Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath);
    mainWindow.webContents.openDevTools();
  }

  // Poll localStorage for token to start screenshot service
  let currentToken = null;
  setInterval(async () => {
    try {
      const token = await mainWindow.webContents.executeJavaScript('localStorage.getItem("team-logger-token")');

      if (token !== currentToken) {
        console.log('Token has changed. Restarting screenshot service.');
        currentToken = token;

        if (token) {
          console.log('Starting service with token:', token.substring(0, 20) + '...');
          screenshotService.startScreenshotService(token);
        } else {
          screenshotService.stopScreenshotService();
        }
      }
    } catch (e) {
      // This can happen if the window is closed or navigating
      console.error('Failed to check for token:', e.message);
    }
  }, 5000); // Check every 5 seconds

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
  console.log('Received set-token event');
  if (token) {
    console.log('Starting service with token from event:', token.substring(0, 20) + '...');
    screenshotService.startScreenshotService(token);
  } else {
    screenshotService.stopScreenshotService();
  }
});
