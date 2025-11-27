import fs from 'fs'
import path from 'path'
import { IModelItem } from '../type/model'
import OpenAI from 'openai'

export const runtime = 'nodejs'

/**
 * 获取模型列表
 * @returns 模型列表
 */
const getModels = () => {
    // 1. 获取配置文件地址
    const filePath = path.join(process.cwd(), 'renderer', 'config', 'models.json')
    const initModels = {
        models: []
    }
    try {
        // 2. 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(initModels), 'utf-8')
            return initModels
        }
        // 3. 读取并解析JSON文件
        const json = fs.readFileSync(filePath, 'utf-8')
        const models = JSON.parse(json)
        // 4. 返回模型配置
        return models
    } catch (error) {
        // 处理文件读取或解析错误
        console.error('Error reading models configuration:', error)
        return initModels
    }
}

/**
 * 新增模型
 * @param model 模型 
 */
const addModel = (model: IModelItem) => {
    // 1. 获取配置文件地址
    const filePath = path.join(process.cwd(), 'renderer', 'config', 'models.json')
    try {
        // 2. 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            const initModels = {
                models: [model]
            }
            fs.writeFileSync(filePath, JSON.stringify(initModels), 'utf-8')
        }
        // 3. 读取并解析JSON文件
        const json = fs.readFileSync(filePath, 'utf-8')
        const models = JSON.parse(json)
        // 4. 添加新模型配置
        models.models.push(model)
        fs.writeFileSync(filePath, JSON.stringify(models), 'utf-8')
    } catch (error) {
        console.error('Error adding model configuration:', error)
    }
}

/**
 * 获取LLM实例
 * @param apiKey 密钥
 * @param baseURL 地址
 * @returns LLM实例
 */
const getLLM = (apiKey: string, baseURL: string) => {
    const LLM = new OpenAI({
        apiKey,
        baseURL
    })
    return LLM
}

/**
 * 调用大模型接口
 * @param LLM LLM实例
 * @param messages 发送的消息数组
 * @param model 模型
 * @param onData 流式数据回调函数
 */
const callLLM = async (LLM: OpenAI, messages: [], model: string, onData: (delta: string) => void) => {
    const stream = await LLM.chat.completions.create({
        model,
        messages,
        stream: true
    })
    for await (const chunk of stream) {
        const delta = chunk.choices[0].delta.content
        if (delta) {
            onData(delta)
        }
    }
}

export {
    getModels,
    addModel,
    getLLM,
    callLLM
}