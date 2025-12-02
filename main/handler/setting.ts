import { ipcMain } from 'electron'
import settingManager from '../utils/setting'

ipcMain.handle('getSettingConfig', (event) => {
    return settingManager.getSettingConfig()
})

ipcMain.handle('setSettingConfig', (event, config: string) => {
    settingManager.setSettingConfig(config)
})

ipcMain.handle('loadSettingConfig', (event) => {
    return settingManager.loadSettingConfig()
})