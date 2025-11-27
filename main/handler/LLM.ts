import fs from 'fs'
import path from 'path'
import { IModelItem } from '../../renderer/type/model'
import OpenAI from 'openai'
import { ipcMain, app } from 'electron'
import { IHistoryItem, Message } from '../../renderer/type/message'
export const runtime = 'nodejs'

/**
 * 获取模型列表
 * @returns 模型列表
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

ipcMain.handle('get-models', async () => {
    const models = getModels()
    return { message: "Models loaded successfully", data: models, code: 200 }
})


/**
 * 新增模型
 * @param model 模型 
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

ipcMain.handle('add-model', async (event, model) => {
    try {
        addModel(model);
        return { message: "Model added successfully", code: 200, data: model };
    } catch (err) {
        console.error(err);
        return { message: "Model added error", code: 500 };
    }
})

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
 * 将单条消息添加到会话历史记录中
 * @param sessionId 会话id
 * @param message 消息
 */
const addHistory = (sessionId: string, message?: Message) => {
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


ipcMain.handle('add-history', async (event, sessionId: string) => {
    addHistory(sessionId)
    return { message: "History Add successfully", data: sessionId, code: 200 }
})

/**
 * 通过会话id获取聊天记录
 * @param sessionId 会话id
 * @returns 聊天记录
 */
const getHistoryBySessionId = (sessionId: string): Message[] => {
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
 * 调用大模型接口
 * @param LLM LLM实例
 * @param messages 发送的消息数组
 * @param model 模型
 * @param sessionId 会话id
 * @param onData 流式数据回调函数
 */
const callLLM = async (LLM: OpenAI, messages: [], model: string, sessionId: string, onData: (delta: string) => void) => {
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

ipcMain.handle('llm:start', async (event, { apiKey, baseURL, messages, sessionId, model }) => {
    try {
        const LLM = getLLM(apiKey, baseURL);

        // 启动异步流式任务，不阻塞 handle 的返回
        callLLM(
            LLM,
            messages,
            model,
            sessionId,
            (delta: string) => {
                event.sender.send("llm:chunk", delta); // 发送流式 chunk
            }
        ).then(() => {
            event.sender.send("llm:end");
        }).catch((err) => {
            console.error(err);
            event.sender.send("llm:error", err.message || "LLM error");
        });

        // handle 必须立即返回（不能挂起等待流结束）
        return { ok: true };

    } catch (e) {
        console.error(e);
        return { ok: false, error: e.message };
    }
})

const getAllHistories = (): IHistoryItem[] => {
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


ipcMain.handle('get-histories', async () => {
    const histories = getAllHistories()
    return { message: "Histories loaded successfully", data: histories, code: 200 }
})

const deleteSingleHistory = (sessionId: string) => {
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

ipcMain.handle('delete-single-history', async (event, sessionId) => {
    deleteSingleHistory(sessionId)
    return { message: "History delete successfully", data: sessionId, code: 200 }
})
const deleteAllHistories = () => {
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

ipcMain.handle('delete-all-histories', async () => {
    deleteAllHistories()
    return { message: 'All histories delete successfully', code: 200 }
})