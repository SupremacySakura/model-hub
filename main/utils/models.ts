import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { IModelItem } from '../../renderer/type/model'

interface IModelConfig {
    models: IModelItem[]
}

class ModelConfigManager {
    private static instance: ModelConfigManager
    private configPath: string
    private config: IModelConfig = { models: [] }
    private dirty = true

    /** 单例入口 */
    public static getInstance() {
        if (!ModelConfigManager.instance) {
            ModelConfigManager.instance = new ModelConfigManager()
        }
        return ModelConfigManager.instance
    }

    /** 私有构造（外部无法 new） */
    private constructor() {
        const userDataPath = app.getPath('userData')
        const configDir = path.join(userDataPath, 'config')

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
        }

        this.configPath = path.join(configDir, 'models.json')
        this.loadConfig()
    }

    /** --- 配置管理 --- */
    private loadConfig() {
        if (!fs.existsSync(this.configPath)) {
            this.saveConfig()
            return
        }
        try {
            const json = fs.readFileSync(this.configPath, 'utf-8')
            const data = JSON.parse(json)
            this.config.models = Array.isArray(data.models) ? data.models : []
        } catch (err) {
            console.error('Error reading models.json:', err)
            this.config.models = []
        }
    }

    private saveConfig() {
        try {
            fs.writeFileSync(
                this.configPath,
                JSON.stringify(this.config, null, 2),
                'utf-8'
            )
        } catch (err) {
            console.error('Error writing models.json:', err)
        }
    }

    /** 更新配置 JSON 字符串 */
    public updateConfig(newConfig: string) {
        try {
            const parsed = JSON.parse(newConfig)
            this.config.models = Array.isArray(parsed.models) ? parsed.models : []
            this.saveConfig()
            this.dirty = true
        } catch (err) {
            console.error('Error updating models.json:', err)
        }
    }

    /** 获取配置 JSON 字符串 */
    public getConfig() {
        return JSON.stringify(this.config, null, 2)
    }

    /** 加载模型数组 */
    public loadModels(): IModelItem[] {
        if (!this.dirty) return this.config.models
        this.loadConfig()
        this.dirty = false
        return this.config.models
    }
}

/** 默认导出单例 */
export default ModelConfigManager.getInstance()
