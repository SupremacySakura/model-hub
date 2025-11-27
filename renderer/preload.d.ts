import { ModelHandler, LLMHandler } from '../main/preload'

declare global {
  interface Window {
    model: ModelHandler
    llm: LLMHandler
  }
}
