import Router from "@koa/router"
import rulesManager from '../../../utils/rules'
import { IRule } from "../../../../renderer/type/rules"

const router = new Router({
    prefix: '/rules'
})

router.get('/', async (ctx) => {
    ctx.body = { message: 'load rules success', code: 200, data: rulesManager.loadRules() }
})

router.post('/add', async (ctx) => {
    const { id, content } = ctx.request.body as IRule
    const rule = {
        id,
        content
    }
    rulesManager.addRule(rule)
    ctx.body = { message: 'add rule success', code: 200, data: id }
})

router.delete('/single', async (ctx) => {
    const { id } = ctx.request.body as IRule
    rulesManager.deleteRule(id)
    ctx.body = { message: 'delete rule success', code: 200, data: id }
})

export default router