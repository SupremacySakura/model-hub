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
    // HTTP 状态码检查
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`请求失败 ${response.status}: ${text}`);
    }
    const reader = response.body?.getReader()
    if (!reader) {
        return
    }
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
        const { value, done } = await reader.read()
        if (done) {
            break
        }
        buffer += decoder.decode(value, { stream: true })

        let sepIndex = buffer.indexOf('\n\n')
        while (sepIndex !== -1) {
            const eventChunk = buffer.slice(0, sepIndex)
            buffer = buffer.slice(sepIndex + 2)

            const lines = eventChunk.split(/\r?\n/)
            const payload = lines
                .filter((l) => l.startsWith('data:'))
                .map((l) => l.replace(/^data:\s?/, ''))
                .join('\n')

            if (payload === '[DONE]') {
                // 结束标记
            } else {
                // 不做 trim，保留空格和换行，避免 Markdown 断裂
                onData(payload)
            }

            sepIndex = buffer.indexOf('\n\n')
        }
    }
}
