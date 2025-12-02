export interface Message {
  id: number
  role: string
  content: string
  time: string
  isError: boolean
}

export interface IHistoryItem {
  sessionId: string
  createdTime: string
  messages: Message[]
}