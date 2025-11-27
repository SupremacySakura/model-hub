import { contextBridge, ipcRenderer } from 'electron'

const llmHandler = {
    start: (params: { apiKey: string, baseURL: string, messages: string, sessionId: string, model: string }) => ipcRenderer.invoke("llm:start", params),

    onChunk: (cb: (arg0: any) => void) => ipcRenderer.on("llm:chunk", (_event, delta) => cb(delta)),

    onEnd: (cb: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on("llm:end", cb),

    onError: (cb: (arg0: any) => void) => ipcRenderer.on("llm:error", (_ev, err) => cb(err)),

    addHistory: (sessionId: string) => ipcRenderer.invoke('add-history', sessionId),

    getAllHistories: () => ipcRenderer.invoke('get-histories'),

    deleteSingleHitory: (sessionId: string) => ipcRenderer.invoke('delete-single-history', sessionId),

    deleteAllHistories: () => ipcRenderer.invoke('delete-all-histories')
}

contextBridge.exposeInMainWorld('llm', llmHandler)

export type LLMHandler = typeof llmHandler
