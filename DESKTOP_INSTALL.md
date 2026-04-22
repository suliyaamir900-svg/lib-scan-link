# 🖥️ LibScan Desktop App — Build & Install Guide

Aap LibScan ko **Windows (.exe)**, **Mac (.dmg)**, ya **Linux (.AppImage)** desktop app ki tarah install kar sakte ho. Ye guide step-by-step batati hai kaise.

> ⚠️ **Important:** Lovable sandbox se directly `.exe` build nahi ho sakta. Aapko apne computer par GitHub se code pull karke build karna hoga (sirf 5 minute lagega).

---

## 📋 Prerequisites

- **Node.js 18+** installed → https://nodejs.org/
- **Git** installed → https://git-scm.com/
- Lovable se project **GitHub par export** kiya hua

---

## 🚀 Step 1 — Code Local Machine Par Laao

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

---

## 🔧 Step 2 — Electron Dependencies Install Karo

```bash
npm install --save-dev electron@^33.0.0 electron-builder@^25.0.0
```

---

## 📝 Step 3 — `package.json` Me Ye Add Karo

Apne local `package.json` me ye 3 cheezein add karo (Lovable wala file mat chedo):

### 3a. `"main"` field (top-level, after `"version"`):
```json
"main": "electron/main.cjs",
```

### 3b. Scripts (inside `"scripts"`):
```json
"electron:dev": "vite build && electron .",
"electron:build:win": "vite build && electron-builder --win",
"electron:build:mac": "vite build && electron-builder --mac",
"electron:build:linux": "vite build && electron-builder --linux"
```

### 3c. Build config (top-level, after `"devDependencies"`):
```json
"build": {
  "appId": "app.lovable.libscan",
  "productName": "LibScan",
  "directories": { "output": "release" },
  "files": ["dist/**/*", "electron/**/*", "package.json"],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "public/favicon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.education"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Education"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

> 💡 Reference snippet `electron/package-additions.json` me bhi available hai.

---

## ▶️ Step 4 — Test Karo (Optional)

```bash
npm run electron:dev
```

Desktop window khulega — agar app sahi chal raha hai to packaging step par jao.

---

## 📦 Step 5 — Installer Banao

Apne OS ke hisaab se command chalao:

### Windows par:
```bash
npm run electron:build:win
```
Output: `release/LibScan Setup x.x.x.exe` (installer) + `release/LibScan x.x.x.exe` (portable)

### Mac par:
```bash
npm run electron:build:mac
```
Output: `release/LibScan-x.x.x.dmg`

### Linux par:
```bash
npm run electron:build:linux
```
Output: `release/LibScan-x.x.x.AppImage`

---

## 💾 Step 6 — Install Karo

- **Windows**: `.exe` installer double-click karo → "Next, Next, Install" → Desktop shortcut + Start Menu me LibScan dikhega
- **Mac**: `.dmg` open karo → LibScan ko Applications folder me drag karo
- **Linux**: `.AppImage` ko executable banao (`chmod +x LibScan-*.AppImage`) → double-click

---

## 🌐 Cross-Platform Build (Advanced)

Ek hi machine se sab platforms ke liye build karna ho:
```bash
npm install --save-dev electron-builder
npx electron-builder --win --mac --linux
```
> ⚠️ Mac builds sirf macOS par hi properly sign hote hain. Windows/Linux par bana sakte ho lekin notarization nahi hoga.

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| Blank white window | `vite.config.ts` me `base: "./"` set hai (already done ✅) |
| `__dirname is not defined` | File extension `.cjs` honi chahiye (already done ✅) |
| Build fails on Linux for Win | `wine` install karo: `sudo apt install wine` |
| Code signing warning on Mac | Normal hai — "Right-click → Open" se bypass karo |

---

## ✨ Features Built-in

- ✅ Auto-hide menu bar (clean look)
- ✅ External links default browser me khulte hain
- ✅ Dark theme background (no white flash on startup)
- ✅ Min window size 1024×700
- ✅ Sandbox + context isolation (secure)

---

**© S_Amir786 — LibScan**
