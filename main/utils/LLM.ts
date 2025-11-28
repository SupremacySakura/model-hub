import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { app } from 'electron'
import { Message } from '../../renderer/type/message'
import { getHistoryBySessionId } from './history'
import { loadMCP } from './MCP'
import { IMCPItem } from '../../renderer/type/MCP'

function convertMCPToolsToOpenAITools(mcp: IMCPItem): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return mcp.tools.map(tool => ({
        type: "function",
        function: {
            name: `${mcp.id}:${tool.name}`,
            description: tool.description || "",
            parameters: tool.inputSchema || {
                type: "object",
                properties: {}
            }
        }
    }));
}

/**
 * 将单条消息添加到会话历史记录中
 * 
 * 创建或更新会话历史文件，将消息添加到指定会话的历史记录中
 * 
 * @param {string} sessionId - 会话唯一标识符
 * @param {Message} [message] - 可选，要添加的消息对象
 * @returns {void}
 * @throws {Error} 读取或写入文件时可能抛出错误
 */
export const addHistory = (sessionId: string, message?: Message) => {
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config", "history")

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, `${sessionId}.json`)
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({
                createdTime: new Date(),
                messages: message ? [message] : []
            }, null, 2), "utf-8")
            return
        }

        const json = fs.readFileSync(filePath, "utf-8")
        const data = JSON.parse(json)
        if (!Array.isArray(data.messages)) {
            data.messages = []
        }
        if (message) {
            data.messages.push(message)
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    } catch (error) {
        console.error("Error writing history:", error)
    }
}

/**
 * 获取OpenAI LLM实例
 * 
 * 根据提供的API密钥和基础URL创建并返回OpenAI实例
 * 
 * @param {string} apiKey - OpenAI API密钥
 * @param {string} baseURL - API请求的基础URL
 * @returns {OpenAI} 配置好的OpenAI实例
 */
export const getLLM = (apiKey: string, baseURL: string) => {
    const LLM = new OpenAI({
        apiKey,
        baseURL
    })
    return LLM
}

/**
 * 调用大模型接口并处理流式响应
 * 
 * 使用OpenAI实例调用聊天完成API，处理流式响应，并将消息保存到会话历史中
 * 
 * @async
 * @param {OpenAI} LLM - 配置好的OpenAI实例
 * @param {Message[]} messages - 要发送的消息数组
 * @param {string} model - 要使用的模型名称
 * @param {string} sessionId - 会话唯一标识符
 * @param {Function} onData - 流式数据回调函数，接收模型返回的文本片段
 * @returns {Promise<void>}
 * @throws {Error} 调用API或处理响应时可能抛出错误
 */
export const callLLM = async (LLM: OpenAI, messages: [], model: string, sessionId: string, onData: (delta: string) => void) => {
    // 将用户信息存储到历史记录中
    for (const message of messages) {
        addHistory(sessionId, message)
    }

    // 加载历史信息
    const historyMessages = getHistoryBySessionId(sessionId).splice(0, 20).filter((item) => item)

    // 存储助手完整回复
    const fullResponse: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        time: new Date().toLocaleString(),
    }

    const newMessages = [...historyMessages, ...messages]

    // 加载MCP配置
    const mcps = await loadMCP()
    const tools = mcps.flatMap((item) => convertMCPToolsToOpenAITools(item))

    // 调用流式接口
    const stream = await LLM.chat.completions.create({
        model,
        messages: newMessages as [],
        stream: true,
        tools,
        tool_choice: "auto"
    })

    // 收集完整的工具调用信息
    const toolCalls: any[] = []
    let currentToolCall: any = null
    let isToolCall = false

    // 处理第一个流式响应
    for await (const chunk of stream) {
        const choice = chunk.choices[0]

        // 检查是否有工具调用
        if (choice.delta.tool_calls) {
            isToolCall = true
            const toolCallDelta = choice.delta.tool_calls[0]

            // 如果是新的工具调用
            if (toolCallDelta.id) {
                // 保存当前工具调用（如果有）
                if (currentToolCall) {
                    toolCalls.push(currentToolCall)
                }
                // 创建新的工具调用对象
                currentToolCall = {
                    id: toolCallDelta.id,
                    type: toolCallDelta.type,
                    function: {
                        name: toolCallDelta.function?.name || '',
                        arguments: toolCallDelta.function?.arguments || ''
                    }
                }
            }
            // 如果是工具调用的继续
            else if (currentToolCall && toolCallDelta.function?.arguments) {
                // 拼接工具调用参数
                currentToolCall.function.arguments += toolCallDelta.function.arguments
            }
        }
        // 检查是否有直接回复内容
        else if (choice.delta.content) {
            // 只有当确定不是工具调用时，才发送直接回复内容
            // 因为如果模型决定调用工具，这些内容可能是不完整的或与最终回复重复
            if (!isToolCall) {
                const delta = choice.delta.content
                if (delta) {
                    onData(delta)
                    fullResponse.content += delta
                }
            }
        }

        // 检查是否完成
        if (choice.finish_reason) {
            // 保存最后一个工具调用（如果有）
            if (currentToolCall) {
                toolCalls.push(currentToolCall)
                currentToolCall = null
            }
            break
        }
    }
    
    // 如果模型决定调用工具
    if (isToolCall && toolCalls.length > 0) {
        console.log("模型要求调用工具:", toolCalls)

        // 调用所有工具并收集结果
        const toolMessages: Message[] = []
        for (const call of toolCalls) {
            try {
                const clientName = call.function.name.split(':')[0]
                const functionName = call.function.name.split(':')[1]
                const mcp = mcps.find((item) => item.id === clientName)

                if (!mcp || !mcp.client) {
                    console.error(`找不到MCP客户端: ${clientName}`)
                    continue
                }

                const client = mcp.client
                const functionArgs = JSON.parse(call.function.arguments)

                // 调用工具
                const res = await client.callTool({
                    name: functionName,
                    arguments: functionArgs
                })

                console.log(`助手调用工具${functionName}，参数${JSON.stringify(functionArgs)}, id:${call.id}, 结果:${JSON.stringify(res)}`)

                const toolCallMessage: Message = {
                    id: call.id,
                    role: 'system',
                    content: `助手调用工具${functionName}，参数${JSON.stringify(functionArgs)}, id:${call.id},结果为:${JSON.stringify(res)}`,
                    time: new Date().toLocaleString()
                }
                // 构建工具调用结果消息
                toolMessages.push(toolCallMessage)
            } catch (error) {
                console.error(`调用工具失败: ${error.message}`, error)
            }
        }

        // 如果有工具调用结果，重新发起请求
        if (toolMessages.length > 0) {
            // 构建包含工具调用结果的新消息列表
            const messagesWithToolResults = [...newMessages, ...toolMessages]

            // 调用流式接口获取最终回复
            const finalStream = await LLM.chat.completions.create({
                model,
                messages: messagesWithToolResults as [],
                stream: true
            })

            // 处理最终流式响应
            for await (const chunk of finalStream) {
                const delta = chunk.choices[0].delta.content
                if (delta) {
                    onData(delta)
                    fullResponse.content += delta
                }
            }
        }
    }

    // 将助手完整回复存储到历史记录中
    addHistory(sessionId, fullResponse)
}

