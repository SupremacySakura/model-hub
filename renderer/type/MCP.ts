import { Client } from "@modelcontextprotocol/sdk/client"
import { Prompt, Resource, Tool } from "@modelcontextprotocol/sdk/types.js"

export interface IMCPItem {
    id: string
    tools: Tool[]
    prompts: Prompt[]
    resources: Resource[]
    isError: boolean
    client?: Client
    errorMessage?: string
}
