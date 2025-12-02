import Router from '@koa/router'
import { LLMService } from '../../../utils/LLM'
import { ICallLLMParams } from '../../../../renderer/type/LLM'

const router = new Router({
    prefix: '/llm'
})

router.post('/call', async (ctx) => {
    const { apiKey, baseURL, messages, sessionId, model, files } = ctx.request.body as ICallLLMParams
    ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
    })
    ctx.status = 200
    const write = (data: string) => {
        ctx.res.write(`data: ${data}\n\n`)
    }
    try {
        const LLM = new LLMService(apiKey, baseURL, model)

        await LLM.chat(messages, sessionId, files, (delta: string) => {
            write(delta)
        })
        ctx.res.write('data: [DONE]\n\n')
        ctx.res.end()
    } catch (error) {
        console.error('聊天失败', error)
        // 设置错误状态码
        ctx.status = 500
        // 发送错误信息给客户端
        write(JSON.stringify({
            error: true,
            message: (error as Error).message || 'Unknown error'
        }))
        ctx.res.write('data: [DONE]\n\n')
        ctx.res.end()
    }
})

export default router