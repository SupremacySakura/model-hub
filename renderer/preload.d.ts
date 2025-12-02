import type { settingIpcType } from '../main/ipc/setting'
declare global {
  interface Window {
    setting: settingIpcType
  }
}
