import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { IHistoryItem, Message } from '../../renderer/type/message'

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
