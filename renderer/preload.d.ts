import { LLMHandler } from '../main/preload'

declare global {
  interface Window {
    llm: LLMHandler
  }
}
