import Router from '@koa/router'
import MCPManager from '../../../utils/MCP'

const router = new Router({
    prefix: '/mcp'
})

router.get('/', (ctx) => {
    const json = MCPManager.getConfig()
    const response = { message: 'Get config successfully', code: 200, data: json }
    ctx.body = response
})

router.post('/update', async (ctx) => {
    const { config } = ctx.request.body as { config: string }
    MCPManager.updateConfig(config)
    const response = { message: 'Update config successfully', code: 200 }
    ctx.body = response
})

router.get('/load', async (ctx) => {
    const mcps = await MCPManager.loadAll()
    const response = {
        message: 'load config successfully', code: 200, data: mcps.map((item) => {
            const { client, ...rest } = item
            return { ...rest }
        })
    }
    ctx.body = response
})

export default router