import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { app } from 'electron'
import { Message } from '../../renderer/type/message'
import { getHistoryBySessionId } from './history'

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

