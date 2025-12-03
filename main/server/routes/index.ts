import Router from '@koa/router'
import LLMRouter from './modules/LLM'
import MCPRouter from './modules/MCP'
import modelsRouter from './modules/models'
import historyRouter from './modules/history'
import filesRouter from './modules/files'
import rulesRouter from './modules/rules'
const router = new Router({
    prefix: '/api'
})

router.get('/', (ctx) => {
    ctx.body = '🚀 欢迎来到 Koa 根路径'
})

// 合并其他模块路由
router.use(LLMRouter.routes(), LLMRouter.allowedMethods())
router.use(MCPRouter.routes(), MCPRouter.allowedMethods())
router.use(modelsRouter.routes(), modelsRouter.allowedMethods())
router.use(historyRouter.routes(), historyRouter.allowedMethods())
router.use(filesRouter.routes(), filesRouter.allowedMethods())
router.use(rulesRouter.routes(), rulesRouter.allowedMethods())

export default router
