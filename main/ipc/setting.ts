import { ipcRenderer } from 'electron'
import { ISettingConfig } from '../utils/setting'
export const settingIpc = {
    getConfig: (): Promise<string> => ipcRenderer.invoke('getSettingConfig'),
    saveConfig: (config: string): Promise<void> => ipcRenderer.invoke('setSettingConfig', config),
    loadConfig: (): Promise<ISettingConfig> => ipcRenderer.invoke('loadSettingConfig')
}

export type settingIpcType = typeof settingIpc