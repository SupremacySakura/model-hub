// LLM相关的IPC主进程处理程序
// 负责处理渲染进程发送的LLM相关请求
import { ipcMain } from 'electron'
// 导入渲染进程的LLM工具函数
import { callLLM, getLLM } from '../utils/LLM'
import MCPManager from '../utils/MCP'
import modelManager from '../utils/models'
import historyManager from '../utils/history'

// 指定运行时环境
export const runtime = 'nodejs'

// 获取模型列表
ipcMain.handle('get-models', async () => {
    const models = modelManager.getConfig()
    return { message: 'Models loaded successfully', data: models, code: 200 }
})

// 更新模型列表
ipcMain.handle('update-models', async (event, config: string) => {
    modelManager.updateConfig(config)
    return { message: 'Models updated successfully', code: 200 }
})

// 加载模型列表
ipcMain.handle('load-models', async () => {
    const models = modelManager.loadModels()
    return { message: 'Models loaded successfully', data: models, code: 200 }
})

// 添加会话历史
ipcMain.handle('add-history', async (event, sessionId: string) => {
    historyManager.add(sessionId)
    return { message: 'History Add successfully', data: sessionId, code: 200 }
})

// 启动LLM流式调用
ipcMain.handle('llm:start', async (event, { apiKey, baseURL, messages, sessionId, model }) => {
    try {
        // 创建LLM实例
        const LLM = getLLM(apiKey, baseURL)

        // 启动异步流式任务，不阻塞handle的返回
        callLLM(
            LLM,
            messages,
            model,
            sessionId,
            // 流式数据回调，将结果发送回渲染进程
            (delta: string) => {
                event.sender.send('llm:chunk', delta) // 发送流式chunk
            }
        ).then(() => {
            // 流式调用结束
            event.sender.send('llm:end')
        }).catch((err) => {
            // 处理错误
            console.error(err)
            event.sender.send('llm:error', err.message || 'LLM error')
        })

        // handle必须立即返回（不能挂起等待流结束）
        return { ok: true }

    } catch (e) {
        console.error(e)
        return { ok: false, error: e.message }
    }
})

// 获取所有会话历史
ipcMain.handle('get-histories', async () => {
    const histories = historyManager.getAll()
    return { message: 'Histories loaded successfully', data: histories, code: 200 }
})

// 删除单个会话历史
ipcMain.handle('delete-single-history', async (event, sessionId) => {
    historyManager.delete(sessionId)
    return { message: 'History delete successfully', data: sessionId, code: 200 }
})

// 删除所有会话历史
ipcMain.handle('delete-all-histories', async () => {
    historyManager.deleteAll()
    return { message: 'All histories delete successfully', code: 200 }
})

// 获取MCP配置
ipcMain.handle('get-mcp-config', async () => {
    const json = MCPManager.getConfig()
    return { message: 'Get config successfully', code: 200, data: json }
})

// 更新MCP配置
ipcMain.handle('update-mcp-config', async (event, config: string) => {
    MCPManager.updateConfig(config)
    return { message: 'Update config successfully', code: 200 }
})

// 解析MCP配置
ipcMain.handle('load-mcp', async () => {
    const mcps = await MCPManager.loadAll()
    return {
        message: 'load config successfully', code: 200, data: mcps.map((item) => {
            const { client, ...rest } = item
            return { ...rest }
        })
    }
})