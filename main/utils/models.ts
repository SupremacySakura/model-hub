import fs from 'fs'
import path from 'path'
import { IModelItem } from '../../renderer/type/model'
import { app } from 'electron'

/**
 * 获取模型列表
 * 
 * 从持久化存储中读取模型配置，若文件不存在则初始化空模型列表
 * 
 * @returns {string} 包含模型列表的JSON字符串，格式为 { models: IModelItem[] }
 * @throws {Error} 读取或解析文件时可能抛出错误
 */
export const getModelConifg = () => {
    // 获取持久化存储路径
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config")

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, "models.json")
    const initModels = JSON.stringify({ models: [] }, null, 2)

    try {
        // 不存在则初始化
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, initModels, "utf-8")
            return initModels
        }

        // 读取 JSON
        const json = fs.readFileSync(filePath, "utf-8")
        return json

    } catch (error) {
        console.error("Error reading models.json:", error)
        return initModels
    }
}

/**
 * 更新模型列表
 * 
 * 将解析后的模型配置写入持久化存储，若文件不存在则初始化
 * 
 * @param {string} config - 包含模型列表的JSON字符串，格式为 { models: IModelItem[] }
 * @returns {void}
 * @throws {Error} 解析或写入文件时可能抛出错误
 */
export const updateModelConfig = (config: string) => {
    try {
        const models = JSON.parse(config)
        if (!Array.isArray(models.models)) {
            models.models = []
        }
        const userDataPath = app.getPath("userData")
        const configDir = path.join(userDataPath, "config")
        const filePath = path.join(configDir, "models.json")
        fs.writeFileSync(filePath, JSON.stringify(models, null, 2), "utf-8")
    } catch (error) {
        console.error("Error updating models.json:", error)
    }
}

/**
 * 加载模型列表
 * 
 * 从持久化存储中读取模型配置，若文件不存在则初始化空模型列表
 * 
 * @returns {IModelItem[]} 模型项数组
 */
export const loadModels = (): IModelItem[] => {
    const models = getModelConifg()
    return JSON.parse(models).models
}
