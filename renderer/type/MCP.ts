import { Prompt, Tool } from "@modelcontextprotocol/sdk/types.js"

export interface MCPItem {
    id: string
    tools: Tool[]
    prompts: Prompt[]
}
