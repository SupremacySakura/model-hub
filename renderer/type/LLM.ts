import { Message } from "./message"

export interface ICallLLMParams {
    apiKey: string
    baseURL: string
    messages: Message[]
    sessionId: string
    model: string
}