/**
 * desktop/main.js — Processus principal Electron.
 * Démarre le serveur Express en interne puis ouvre l'application
 * dans une fenêtre de bureau (sans navigateur visible).
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const net = require('net');
const http = require('http');

/* ---------- Trouver un port libre (évite les conflits) ---------- */
function findFreePort(start = 3000) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once('error', () => resolve(findFreePort(start + 1)));
    srv.once('listening', () => srv.close(() => resolve(start)));
    srv.listen(start);
  });
}

/* ---------- Attendre que le serveur Express réponde ---------- */
function waitForServer(port, attempts = 50) {
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http.get(`http://localhost:${port}/api/settings`, res => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (--attempts <= 0) return reject(new Error('Serveur introuvable'));
        setTimeout(tryOnce, 200);
      });
    };
    tryOnce();
  });
}

/* ---------- Fenêtre principale ---------- */
function createWindow(port) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'BNS Stock Manager',
    icon: path.join(__dirname, '..', 'uploads', 'images', 'logo.png'),
    autoHideMenuBar: true,          // pas de menu → look "logiciel"
    backgroundColor: '#f5f7fa',
    webPreferences: {
      nodeIntegration: false,       // sécurité : la page reste une simple page web
      contextIsolation: true
    }
  });

  win.loadURL(`http://localhost:${port}`);

  // print.html s'ouvre dans une fenêtre séparée (impression / PDF)
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      width: 900, height: 700,
      autoHideMenuBar: true,
      title: 'Document — BNS Stock Manager'
    }
  }));

  // Liens externes éventuels → navigateur système
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`http://localhost:${port}`)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

/* ---------- Cycle de vie ---------- */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit(); // une seule instance à la fois
} else {
  app.whenReady().then(async () => {
    try {
      const port = await findFreePort(3000);
      process.env.PORT = String(port);

      // Démarre Express + SQLite + sauvegardes dans ce processus
      require(path.join(__dirname, '..', 'server', 'server.js'));

      await waitForServer(port);
      createWindow(port);
    } catch (err) {
      console.error('Échec du démarrage :', err);
      app.quit();
    }
  });

  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { win.restore(); win.focus(); }
  });

  // Quitter ferme aussi le serveur (même processus)
  app.on('window-all-closed', () => app.quit());
}
