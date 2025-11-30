import Koa from 'koa'
import router from './routes'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'

const app = new Koa()

app.use(cors({
    origin: '*', // 允许所有来源，也可以设置为特定域名如 'http://localhost:5173'
    credentials: true, // 如果你前端要发送 cookie，就设为 true
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['Authorization'] // 关键：暴露 Authorization 响应头
}))
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 11435

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})