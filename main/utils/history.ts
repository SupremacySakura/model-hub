import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { IHistoryItem, Message } from '../../renderer/type/message'
import { safeParseJSON } from './common'

class HistoryManager {
    private static instance: HistoryManager
    private historyDir: string

    private constructor() {
        const userDataPath = app.getPath('userData')
        this.historyDir = path.join(userDataPath, 'config', 'history')

        if (!fs.existsSync(this.historyDir)) {
            fs.mkdirSync(this.historyDir, { recursive: true })
        }
    }

    /** 单例获取实例 */
    public static getInstance(): HistoryManager {
        if (!HistoryManager.instance) {
            HistoryManager.instance = new HistoryManager()
        }
        return HistoryManager.instance
    }

    /** 添加历史消息 */
    public add(sessionId: string, message?: Message) {
        const filePath = path.join(this.historyDir, `${sessionId}.json`)

        try {
            if (!fs.existsSync(filePath)) {
                const data = {
                    createdTime: new Date(),
                    messages: message ? [message] : [],
                }
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
                return
            }

            const json = fs.readFileSync(filePath, 'utf8')
            const data = safeParseJSON<IHistoryItem>(json)

            if (!Array.isArray(data.messages)) {
                data.messages = []
            }
            if (message) {
                data.messages.push(message)
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        } catch (err) {
            console.error('Error writing history:', err)
        }
    }

    /** 获取某个会话的历史记录 */
    public getBySessionId(sessionId: string): IHistoryItem {
        const filePath = path.join(this.historyDir, `${sessionId}.json`)
        try {
            if (!fs.existsSync(filePath)) {
                this.add(sessionId)
            }
            const json = fs.readFileSync(filePath, 'utf8')
            const data = safeParseJSON<IHistoryItem>(json)
            return {
                sessionId,
                messages: Array.isArray(data.messages)
                    ? data.messages.filter(Boolean)
                    : [],
                createdTime: data.createdTime?.toLocaleString() || '',
            }
        } catch (err) {
            console.error('Error reading history:', err)
            return {
                sessionId,
                messages: [],
                createdTime: '',
            }
        }
    }

    /** 获取所有历史记录 */
    public getAll(): IHistoryItem[] {
        const items: IHistoryItem[] = []

        try {
            const files = fs.readdirSync(this.historyDir)

            for (const file of files) {
                const filePath = path.join(this.historyDir, file)
                const json = fs.readFileSync(filePath, 'utf8')
                const data = safeParseJSON<IHistoryItem>(json)

                items.push({
                    sessionId: file.replace('.json', ''),
                    messages: Array.isArray(data.messages)
                        ? data.messages.filter(Boolean)
                        : [],
                    createdTime: data.createdTime,
                })
            }
        } catch (err) {
            console.error('Error reading histories:', err)
        }

        return items.sort(
            (a, b) =>
                new Date(b.createdTime).getTime() -
                new Date(a.createdTime).getTime()
        )
    }

    /** 删除某一个会话 */
    public delete(sessionId: string) {
        const filePath = path.join(this.historyDir, `${sessionId}.json`)
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        } catch (err) {
            console.error(`Error deleting ${sessionId}:`, err)
        }
    }

    /** 删除所有会话 */
    public deleteAll() {
        try {
            const files = fs.readdirSync(this.historyDir)
            for (const f of files) {
                fs.unlinkSync(path.join(this.historyDir, f))
            }
        } catch (err) {
            console.error('Error deleting all histories:', err)
        }
    }
}

export default HistoryManager.getInstance()
