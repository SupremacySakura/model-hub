import OpenAI from 'openai'
import { Stream } from 'openai/streaming'
import { Message } from '../../renderer/type/message'
import historyManager from './history'
import MCPManager from './MCP'
import { IMCPItem } from '../../renderer/type/MCP'
import filesManager from './files'

/** tool call 类型 */
type ToolCall = {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

/**
 * LLM 服务类
 * 负责：
 * 1. 和 OpenAI 通信
 * 2. 自动工具调用（MCP）
 * 3. 管理上下文历史
 */
export class LLMService {
    private llm: OpenAI
    private model: string
    private maxToolRounds = 5
    private toolsNameSplitString = '__'

    constructor(apiKey: string, baseURL: string, model: string) {
        this.llm = new OpenAI({
            apiKey,
            baseURL
        })
        this.model = model
    }

    /** MCP Tools 转 OpenAI Tools */
    private convertMCPToolsToOpenAITools(mcp: IMCPItem): OpenAI.Chat.Completions.ChatCompletionTool[] {
        return mcp.tools.map(tool => ({
            type: 'function',
            function: {
                name: `${mcp.id}${this.toolsNameSplitString}${tool.name}`,
                description: tool.description || '',
                parameters: tool.inputSchema || {
                    type: 'object',
                    properties: {}
                }
            }
        }))
    }

    /** 解析流式工具调用和内容输出 */
    private async parseToolCallsFromStream(stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>, onData: (data: string) => void): Promise<ToolCall[]> {
        const toolCalls: ToolCall[] = []
        let currentToolCall: ToolCall | null = null

        for await (const chunk of stream) {
            const choice = chunk.choices[0]

            /** 处理 tool_calls */
            if (choice.delta.tool_calls) {
                const toolCallDelta = choice.delta.tool_calls[0]

                // 新的 tool call
                if (toolCallDelta.id) {
                    if (currentToolCall) {
                        toolCalls.push(currentToolCall)
                    }

                    currentToolCall = {
                        id: toolCallDelta.id,
                        type: toolCallDelta.type,
                        function: {
                            name: toolCallDelta.function?.name || '',
                            arguments: toolCallDelta.function?.arguments || ''
                        }
                    }
                }

                // arguments 续写
                else if (currentToolCall && toolCallDelta.function?.arguments) {
                    currentToolCall.function.arguments += toolCallDelta.function.arguments
                }
            }

            /** 普通文本输出 */
            if (choice.delta.content) {
                onData(choice.delta.content)
            }

            if (choice.finish_reason) {
                if (currentToolCall) {
                    toolCalls.push(currentToolCall)
                    currentToolCall = null
                }
                break
            }
        }

        return toolCalls
    }

    /** 执行 MCP 工具 */
    private async executeToolCalls(mcps: IMCPItem[], toolCalls: ToolCall[]): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
        const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

        for (const call of toolCalls) {
            const [clientName, functionName] = call.function.name.split(this.toolsNameSplitString)
            const mcp = mcps.find(item => item.id === clientName)

            if (!mcp || !mcp.client) {
                console.error(`找不到MCP客户端: ${clientName}`)
                continue
            }

            const args = JSON.parse(call.function.arguments)

            try {
                const res = await mcp.client.callTool({
                    name: functionName,
                    arguments: args
                })

                console.error(`调用工具: ${functionName}`, args, res)

                toolMessages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    content: JSON.stringify(res)
                })

            } catch (error: any) {
                console.error(`调用工具失败，尝试重连: ${clientName}`)

                const config = JSON.parse(MCPManager.getConfig())
                const newClient = await MCPManager.loadSingleMCP(clientName, config.mcpServers[clientName])

                if (newClient) MCPManager.relinkClient(clientName, newClient)

                const res = await newClient?.callTool({
                    name: functionName,
                    arguments: args
                })

                toolMessages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    content: JSON.stringify(res)
                })
            }
        }

        return toolMessages
    }

    /** 对外主方法：询问 LLM */
    public async chat(messages: Message[], sessionId: string, files: string[], onData: (delta: string) => void): Promise<void> {
        /** 写入历史 */
        for (const message of messages) {
            historyManager.add(sessionId, message)
        }

        const historyMessages = historyManager.getBySessionId(sessionId).messages.splice(0, 20).filter(Boolean)

        const fullResponse: Message = {
            id: Date.now(),
            role: 'assistant',
            content: '',
            time: new Date().toLocaleString(),
            isError: false
        }
        const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            ...historyMessages,
            ...messages,
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[]

        try {
            // 检查用户是否上传文件
            if (files.length > 0) {
                conversation.push({
                    role: 'user',
                    content: `这是用户传递的文件：${filesManager.getFilesContent(files)?.join('\n')}`,
                })
            }

            const mcps = await MCPManager.loadAll()
            const tools = mcps.flatMap(mcp => this.convertMCPToolsToOpenAITools(mcp))

            let round = 0

            while (round < this.maxToolRounds) {
                round++
                console.error(`🤖 Round ${round}`)

                const stream = await this.llm.chat.completions.create({
                    model: this.model,
                    messages: conversation as [],
                    stream: true,
                    tools,
                    tool_choice: 'auto'
                })

                const toolCalls = await this.parseToolCallsFromStream(stream, (delta) => {
                    fullResponse.content += delta
                    onData(delta)
                })

                if (toolCalls.length > 0) {
                    conversation.push({
                        role: 'assistant',
                        tool_calls: toolCalls
                    })
                    const toolMessages = await this.executeToolCalls(mcps, toolCalls)
                    conversation.push(...toolMessages)
                    continue
                }
                break
            }

            console.error('对话完成')
            historyManager.add(sessionId, fullResponse)
            filesManager.deleteAllFile()
        } catch (error) {
            const errorMessages = JSON.stringify({
                error: true,
                message: (error as Error).message || 'Unknown error'
            })
            fullResponse.isError = true
            fullResponse.content = errorMessages
            historyManager.add(sessionId, fullResponse)
            filesManager.deleteAllFile()
            throw error
        }
    }
}
