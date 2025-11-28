import fs from 'fs'
import path from 'path'
import { IModelItem } from '../../renderer/type/model'
import OpenAI from 'openai'
import { app } from 'electron'
import { IHistoryItem, Message } from '../../renderer/type/message'
/**
 * 运行时环境配置
 * 
 * 指定该模块的运行环境
 * 
 * @type {string}
 */
export const runtime = 'nodejs'
/**
 * 获取模型列表
 * 
 * 从持久化存储中读取模型配置，若文件不存在则初始化空模型列表
 * 
 * @returns {Object} 包含模型列表的对象，格式为 { models: IModelItem[] }
 * @throws {Error} 读取或解析文件时可能抛出错误
 */
export const getModels = () => {
    // 获取持久化存储路径
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config")

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, "models.json")
    const initModels = { models: [] }

    try {
        // 不存在则初始化
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(initModels, null, 2), "utf-8")
            return initModels
        }

        // 读取 JSON
        const json = fs.readFileSync(filePath, "utf-8")
        return JSON.parse(json)

    } catch (error) {
        console.error("Error reading models.json:", error)
        return initModels
    }
}

/**
 * 新增模型到配置文件
 * 
 * 将新模型添加到持久化存储的模型列表中
 * 
 * @param {IModelItem} model - 要添加的模型对象
 * @returns {void}
 * @throws {Error} 读取或写入文件时可能抛出错误
 */
export const addModel = (model: IModelItem) => {
    const userDataPath = app.getPath("userData")
    const filePath = path.join(userDataPath, "config", "models.json")

    let data = { models: [] }
    try {
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        }
    } catch { }

    data.models.push(model)

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

/**
 * 删除指定模型
 * 
 * 从持久化存储中删除指定的模型配置
 * 
 * @param {IModelItem} model - 要删除的模型对象
 * @returns {void}
 * @throws {Error} 读取或写入文件时可能抛出错误
 */
export const deleteModel = (model: IModelItem) => {
    const userDataPath = app.getPath("userData")
    const filePath = path.join(userDataPath, "config", "models.json")

    let data = { models: [] }
    try {
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        }
    } catch (error) {
        console.error("Error reading models.json:", error)
        return
    }

    // 过滤掉要删除的模型
    data.models = data.models.filter((item: IModelItem) => item.id !== model.id)

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    } catch (error) {
        console.error("Error writing models.json:", error)
    }
}

/**
 * 将单条消息添加到会话历史记录中
 * 
 * 创建或更新会话历史文件，将消息添加到指定会话的历史记录中
 * 
 * @param {string} sessionId - 会话唯一标识符
 * @param {Message} [message] - 可选，要添加的消息对象
 * @returns {void}
 * @throws {Error} 读取或写入文件时可能抛出错误
 */
export const addHistory = (sessionId: string, message?: Message) => {
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config", "history")

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, `${sessionId}.json`)
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({
                createdTime: new Date(),
                messages: message ? [message] : []
            }, null, 2), "utf-8")
            return
        }

        const json = fs.readFileSync(filePath, "utf-8")
        const data = JSON.parse(json)
        if (!Array.isArray(data.messages)) {
            data.messages = []
        }
        if (message) {
            data.messages.push(message)
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    } catch (error) {
        console.error("Error writing history:", error)
    }
}

/**
 * 通过会话ID获取聊天记录
 * 
 * 从持久化存储中读取指定会话的完整聊天记录
 * 
 * @param {string} sessionId - 会话唯一标识符
 * @returns {Message[]} 聊天消息数组，按时间顺序排列
 * @throws {Error} 读取或解析文件时可能抛出错误
 * @private
 */
export const getHistoryBySessionId = (sessionId: string): Message[] => {
    // 获取持久化存储路径
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config", "history")

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, `${sessionId}.json`)
    try {
        if (!fs.existsSync(filePath)) {
            return []
        }
        const json = fs.readFileSync(filePath, "utf-8")
        const data = JSON.parse(json)
        return data.messages
    } catch (error) {
        console.error("Error writing history:", error)
        return []
    }
}

/**
 * 获取所有会话历史记录
 * 
 * 从持久化存储中读取所有会话历史文件，并返回按创建时间倒序排列的会话列表
 * 
 * @returns {IHistoryItem[]} 会话历史数组，包含每个会话的ID、消息列表和创建时间
 * @throws {Error} 读取或解析文件时可能抛出错误
 */
export const getAllHistories = (): IHistoryItem[] => {
    const userDataPath = app.getPath("userData")
    const historyDir = path.join(userDataPath, "config", "history")
    const histories: IHistoryItem[] = []

    try {
        if (!fs.existsSync(historyDir)) {
            return histories
        }

        const files = fs.readdirSync(historyDir)
        for (const file of files) {
            const filePath = path.join(historyDir, file)
            const json = fs.readFileSync(filePath, "utf-8")
            const data = JSON.parse(json)

            histories.push({
                sessionId: file.replace('.json', ''),
                messages: Array.isArray(data.messages)
                    ? data.messages.filter(Boolean) // 清理 messages 中的 null/undefined
                    : [],
                createdTime: data.createdTime
            })
        }
    } catch (error) {
        console.error("Error reading histories:", error)
    }

    // 按 createdTime 从新到旧排序
    return histories
        .filter(item => item) // 过滤掉可能的 null
        .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
}

/**
 * 删除单个会话历史记录
 * 
 * 根据会话ID删除对应的历史记录文件
 * 
 * @param {string} sessionId - 要删除的会话唯一标识符
 * @returns {void}
 * @throws {Error} 删除文件时可能抛出错误
 */
export const deleteSingleHistory = (sessionId: string) => {
    if (!sessionId) return

    const userDataPath = app.getPath("userData")
    const historyDir = path.join(userDataPath, "config", "history")
    const filePath = path.join(historyDir, `${sessionId}.json`)

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
    } catch (error) {
        console.error(`Error deleting history ${sessionId}:`, error)
    }
}

/**
 * 删除所有会话历史记录
 * 
 * 删除持久化存储中的所有会话历史文件
 * 
 * @returns {void}
 * @throws {Error} 读取或删除文件时可能抛出错误
 */
export const deleteAllHistories = () => {
    const userDataPath = app.getPath("userData")
    const historyDir = path.join(userDataPath, "config", "history")

    try {
        if (!fs.existsSync(historyDir)) return

        const files = fs.readdirSync(historyDir)
        for (const file of files) {
            const filePath = path.join(historyDir, file)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        }
    } catch (error) {
        console.error("Error deleting all histories:", error)
    }
}

/**
 * 获取OpenAI LLM实例
 * 
 * 根据提供的API密钥和基础URL创建并返回OpenAI实例
 * 
 * @param {string} apiKey - OpenAI API密钥
 * @param {string} baseURL - API请求的基础URL
 * @returns {OpenAI} 配置好的OpenAI实例
 */
export const getLLM = (apiKey: string, baseURL: string) => {
    const LLM = new OpenAI({
        apiKey,
        baseURL
    })
    return LLM
}

/**
 * 调用大模型接口并处理流式响应
 * 
 * 使用OpenAI实例调用聊天完成API，处理流式响应，并将消息保存到会话历史中
 * 
 * @async
 * @param {OpenAI} LLM - 配置好的OpenAI实例
 * @param {Message[]} messages - 要发送的消息数组
 * @param {string} model - 要使用的模型名称
 * @param {string} sessionId - 会话唯一标识符
 * @param {Function} onData - 流式数据回调函数，接收模型返回的文本片段
 * @returns {Promise<void>}
 * @throws {Error} 调用API或处理响应时可能抛出错误
 */
export const callLLM = async (LLM: OpenAI, messages: [], model: string, sessionId: string, onData: (delta: string) => void) => {
    // 将用户信息存储到历史记录中
    for (const message of messages) {
        addHistory(sessionId, message)
    }
    // 加载历史信息
    const historyMessages = getHistoryBySessionId(sessionId).splice(0, 20).filter((item) => item)
    // 存储助手完整回复
    const fullResponse: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        time: new Date().toLocaleString(),
    }
    const newMessages = [...historyMessages, ...messages]
    // 调用流式接口
    const stream = await LLM.chat.completions.create({
        model,
        messages: newMessages as [],
        stream: true
    })
    for await (const chunk of stream) {
        const delta = chunk.choices[0].delta.content
        if (delta) {
            onData(delta)
            fullResponse.content += delta
        }
    }
    // 将助手完整回复存储到历史记录中
    addHistory(sessionId, fullResponse)
}
