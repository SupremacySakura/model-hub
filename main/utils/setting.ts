import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface ISettingConfig {
    LLM_CONTEXT_LENGTH: number
}

class Setting {
    private static instance: Setting
    private settingConfigPath: string = ''
    private config: ISettingConfig = {
        LLM_CONTEXT_LENGTH: 20,
    }
    public static getInstance() {
        if (!Setting.instance) {
            const instance = new Setting()
            Setting.instance = instance
        }
        return Setting.instance
    }
    private constructor() {
        const userDataPath = app.getPath('userData')
        const settingConfigDir = path.join(userDataPath, 'config')
        if (!fs.existsSync(settingConfigDir)) {
            fs.mkdirSync(settingConfigDir)
        }
        this.settingConfigPath = path.join(settingConfigDir, 'setting.json')
        this.config = this.loadConfig()
    }
    public loadConfig(): ISettingConfig {
        if (!fs.existsSync(this.settingConfigPath)) {
            const userDataPath = app.getPath('userData')
            const settingConfigDir = path.join(userDataPath, 'config')
            if (!fs.existsSync(settingConfigDir)) {
                fs.mkdirSync(settingConfigDir)
            }
            this.settingConfigPath = path.join(settingConfigDir, 'setting.json')
            fs.writeFileSync(this.settingConfigPath, JSON.stringify(this.config, null, 2))
            return this.config
        }
        const data = fs.readFileSync(this.settingConfigPath, 'utf-8')
        const config = JSON.parse(data)
        return { ...this.config, ...config }
    }
    public saveConfig() {
        fs.writeFileSync(this.settingConfigPath, JSON.stringify(this.config, null, 2))
    }
    public getSettingConfig() {
        return JSON.stringify(this.config)
    }
    public setSettingConfig(config: string) {
        this.config = { ...this.config, ...JSON.parse(config) }
        this.saveConfig()
    }
    public loadSettingConfig() {
        return this.config
    }
}

export default Setting.getInstance()