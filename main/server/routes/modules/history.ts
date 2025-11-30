import Router from '@koa/router'
import historyManager from '../../../utils/history'

const router = new Router({
    prefix: '/history'
})

router.get('/', (ctx) => {
    const histories = historyManager.getAll()
    const response = { message: 'Histories loaded successfully', data: histories, code: 200 }
    ctx.body = response
})

router.post('/add', (ctx) => {
    const { sessionId } = ctx.request.body as { sessionId: string }
    historyManager.add(sessionId)
    const response = { message: 'Add history successfully', code: 200 }
    ctx.body = response
})

router.delete('/single', (ctx) => {
    const { sessionId } = ctx.request.body as { sessionId: string }
    historyManager.delete(sessionId)
    const response = { message: 'Delete single history successfully', code: 200 }
    ctx.body = response
})

router.delete('/all', (ctx) => {
    historyManager.deleteAll()
    const response = { message: 'Delete all histories successfully', code: 200 }
    ctx.body = response
})
export default router