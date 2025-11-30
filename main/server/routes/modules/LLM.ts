import Router from '@koa/router'
import { callLLM, getLLM } from '../../../utils/LLM'
import { ICallLLMParams } from '../../../../renderer/type/LLM'

const router = new Router({
    prefix: '/llm'
})

router.post('/call', async (ctx) => {
    const { apiKey, baseURL, messages, sessionId, model } = ctx.request.body as ICallLLMParams
    ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
    })
    ctx.status = 200
    try {
        const LLM = getLLM(apiKey, baseURL)
        const write = (data: string) => {
            ctx.res.write(`data: ${data}\n\n`)
        }
        await callLLM(LLM, messages, model, sessionId, (delta: string) => {
            write(delta)
        })
    } catch (error) {

    }
    ctx.res.write('data: [DONE]\n\n')
    ctx.res.end()
})

export default router