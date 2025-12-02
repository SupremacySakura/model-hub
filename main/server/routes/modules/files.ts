import Router from '@koa/router'
import filesManager from '../../../utils/files'
import path from 'path'

const router = new Router({
    prefix: '/files'
})

router.post('/upload', async (ctx) => {
    const files = ctx.request.files['files[]']
    let data = []
    if (Array.isArray(files)) {
        // 说明上传了多个文件
        data = files.map((file) => file.filepath)
    } else {
        // 进入这里说明只上传了一个文件
        data[0] = files.filepath
    }
    await filesManager.saveFiles(data)
    const response = { message: 'Files loaded successfully', data: data.map((item) => ({ name: path.basename(item), url: item })), code: 200 }
    ctx.body = response
})

export default router