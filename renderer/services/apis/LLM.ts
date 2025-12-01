import { ICallLLMParams } from "../../type/LLM"

/**
 * 调用大语言模型API
 * @async
 * @param {ICallLLMParams} params - 调用大语言模型的参数
 * @param {Function} onData - 流式数据回调函数，用于处理模型返回的流式响应
 * @returns {Promise<void>} 无返回值
 */
export const callLLM = async (params: ICallLLMParams, onData: (data: string) => void): Promise<void> => {
    const response = await fetch(`http://localhost:11435/api/llm/call`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    })
    const reader = response.body?.getReader()
    if (!reader) {
        return
    }
    const decoder = new TextDecoder('utf-8')
    while (true) {
        const { value, done } = await reader.read()
        if (done) {
            break
        }
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n\n') // SSE 每条事件以空行分隔
        for (const line of lines) {
            const data = line.replace(/^data: /, '')
            if (data !== '[DONE]' && data.trim() !== '') {
                onData(data)
            }
        }
    }
}