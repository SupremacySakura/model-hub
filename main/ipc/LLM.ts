// LLM相关的IPC渲染进程桥接
// 使用contextBridge安全地暴露LLM API给渲染进程
import { contextBridge, ipcRenderer } from 'electron'
import { IModelItem } from '../../renderer/type/model'

// LLM处理程序对象，包含所有LLM相关的IPC方法
const llmHandler = {
    // 启动LLM流式调用
    start: (params: { apiKey: string, baseURL: string, messages: string, sessionId: string, model: string }) => ipcRenderer.invoke("llm:start", params),

    // 监听LLM流式输出
    onChunk: (cb: (arg0: any) => void) => ipcRenderer.on("llm:chunk", (_event, delta) => cb(delta)),

    // 监听LLM流式调用结束
    onEnd: (cb: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on("llm:end", cb),

    // 监听LLM流式调用错误
    onError: (cb: (arg0: any) => void) => ipcRenderer.on("llm:error", (_ev, err) => cb(err)),

    // 添加会话历史
    addHistory: (sessionId: string) => ipcRenderer.invoke('add-history', sessionId),

    // 获取所有会话历史
    getAllHistories: () => ipcRenderer.invoke('get-histories'),

    // 删除单个会话历史
    deleteSingleHitory: (sessionId: string) => ipcRenderer.invoke('delete-single-history', sessionId),

    // 删除所有会话历史
    deleteAllHistories: () => ipcRenderer.invoke('delete-all-histories'),

    // 获取模型列表
    getModels: () => ipcRenderer.invoke('get-models'),

    // 添加新模型
    addModel: (model: IModelItem) => ipcRenderer.invoke('add-model', model),

    // 删除模型
    deleteModel: (model: IModelItem) => ipcRenderer.invoke('delete-model', model)
}

// 将llmHandler暴露到全局window对象，供渲染进程使用
contextBridge.exposeInMainWorld('llm', llmHandler)

// 导出LLMHandler类型，用于TypeScript类型检查
export type LLMHandler = typeof llmHandler
