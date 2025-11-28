import { Client } from "@modelcontextprotocol/sdk/client"
import { Prompt, Tool } from "@modelcontextprotocol/sdk/types.js"

export interface IMCPItem {
    id: string
    tools: Tool[]
    prompts: Prompt[]
    client: Client
}
