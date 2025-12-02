import path from 'path'
import { app, Menu } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import MCPManager from './utils/MCP'
import filesManager from './utils/files'
import './server/index'
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady()
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    minWidth: 600
  })
  if (isProd) {
    Menu.setApplicationMenu(null)
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', async () => {
  await MCPManager.closeAllClient()
  filesManager.deleteAllFile()
})

process.on('exit', async () => {
  await MCPManager.closeAllClient()
  filesManager.deleteAllFile()
})
