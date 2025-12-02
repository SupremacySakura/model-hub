import Koa from 'koa'
import router from './routes'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import koaBody from 'koa-body'
import path from 'path'
import fs from 'fs'
import serve from 'koa-static'
import mount from 'koa-mount'
import MCPManager from '../utils/MCP'
import filesManager from '../utils/files'

const filesDir = filesManager.getFileDir()
if (!fs.existsSync(filesDir)) { fs.mkdirSync(filesDir, { recursive: true }) }

const app = new Koa()

app.use(cors({
    origin: '*', // 允许所有来源，也可以设置为特定域名如 'http://localhost:5173'
    credentials: true, // 如果你前端要发送 cookie，就设为 true
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['Authorization'] // 关键：暴露 Authorization 响应头
}))

app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: filesDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB限制
        onFileBegin: (name, file) => {
            // 保留原始文件名
            const originalName = file.originalFilename;
            const filePath = path.join(filesDir, originalName);

            // 避免文件名冲突，可加时间戳或随机数
            if (fs.existsSync(filePath)) {
                const ext = path.extname(originalName);
                const base = path.basename(originalName, ext);
                const newName = `${base}-${Date.now()}${ext}`;
                file.filepath = path.join(filesDir, newName);
            } else {
                file.filepath = filePath;
            }
        }
    }
}))
app.use(bodyParser())
app.use(mount('/files', serve(filesDir)))
app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 11435

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    // 提前加载所有MCP防止第一次询问的时候加载时间过长
    MCPManager.loadAll()
})