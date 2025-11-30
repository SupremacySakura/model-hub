import Router from '@koa/router'
import modelManager from '../../../utils/models'

const router = new Router({
    prefix: '/models'
})

router.get('/', (ctx) => {
    const models = modelManager.getConfig()
    const response = { message: 'Models loaded successfully', data: models, code: 200 }
    ctx.body = response
})

router.post('/update', (ctx) => {
    const { config } = ctx.request.body as { config: string }
    console.log('update models config', config)
    modelManager.updateConfig(config)
    const response = { message: 'Models updated successfully', code: 200 }
    ctx.body = response
})

router.get('/load', (ctx) => {
    const models = modelManager.loadModels()
    const response = { message: 'Models loaded successfully', data: models, code: 200 }
    ctx.body = response
})

export default router