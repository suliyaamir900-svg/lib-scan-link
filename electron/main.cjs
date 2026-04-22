// Electron main process for LibScan desktop app
// Run on local machine (not Lovable sandbox) to package as .exe / .dmg / .AppImage

const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "LibScan — Library Management",
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links in the user's default browser, not inside Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  if (isDev) {
    // In dev, load the running Vite server
    win.loadURL("http://localhost:8080");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // In production, load the built static files
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

// Hide the default menu bar on Windows/Linux for a cleaner app feel
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
