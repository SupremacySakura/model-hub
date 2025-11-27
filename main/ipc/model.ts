import { contextBridge, ipcRenderer } from 'electron'

const modelHandler = {
    getModels: () => ipcRenderer.invoke('get-models'),
    addModel: (model: unknown) => ipcRenderer.invoke('add-model', model),
}

contextBridge.exposeInMainWorld('model', modelHandler)

export type ModelHandler = typeof modelHandler