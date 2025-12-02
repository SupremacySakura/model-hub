import { contextBridge } from 'electron'
import { settingIpc } from './ipc/setting'

contextBridge.exposeInMainWorld('setting', settingIpc)