import { Client } from '@modelcontextprotocol/sdk/client'
import { StdioClientTransport, StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { IMCPItem } from '../../renderer/type/MCP'

interface HTTPServerParameters {
    url: string
    headers?: Record<string, string>
}

interface IMCPConfig {
    mcpServers: Record<string, StdioServerParameters | HTTPServerParameters>
}

class MCPManager {
    private static instance: MCPManager
    private configPath: string
    private config: IMCPConfig = { mcpServers: {} }
    private cache: IMCPItem[] = []
    private dirty = true
    private clientList: Client[] = []
    /** 单例入口 */
    public static getInstance() {
        if (!MCPManager.instance) {
            MCPManager.instance = new MCPManager()
        }
        return MCPManager.instance
    }

    /** 私有构造（外部无法 new） */
    private constructor() {
        const userDataPath = app.getPath('userData')
        const configDir = path.join(userDataPath, 'config')

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
        }

        this.configPath = path.join(configDir, 'mcp.json')
        this.loadConfig()
    }

    /** --- 配置管理 --- */
    private loadConfig() {
        if (!fs.existsSync(this.configPath)) {
            this.saveConfig()
            return
        }
        const json = fs.readFileSync(this.configPath, 'utf-8')
        this.config = JSON.parse(json)
    }

    private saveConfig() {
        fs.writeFileSync(
            this.configPath,
            JSON.stringify(this.config, null, 2),
            'utf-8'
        )
    }

    public updateConfig(newConfig: string) {
        this.config = JSON.parse(newConfig)
        this.saveConfig()
        this.dirty = true
    }

    public getConfig() {
        return JSON.stringify(this.config, null, 2)
    }

    /** --- 加载所有 MCP 服务器 --- */
    public async loadAll(): Promise<IMCPItem[]> {
        if (!this.dirty && this.cache.length > 0) {
            return this.cache
        }

        const mcps: IMCPItem[] = []

        for (const name in this.config.mcpServers) {
            const conf = this.config.mcpServers[name]
            const result: IMCPItem = {
                id: name,
                tools: [],
                prompts: [],
                resources: [],
                isError: false,
            }
            try {
                const client = new Client({ name, version: '1.0.0' })

                let transport: StdioClientTransport | StreamableHTTPClientTransport

                if ('command' in conf) {
                    transport = new StdioClientTransport(conf)
                } else {
                    transport = new StreamableHTTPClientTransport(
                        new URL(conf.url),
                        { requestInit: { headers: conf.headers } }
                    )
                }

                await client.connect(transport)
                result.client = client
                try {
                    const tools = await client.listTools()
                    result.tools = tools.tools
                } catch (error) {
                    console.error(`MCP服务器${name}中不存在tools`)
                }
                try {
                    const prompts = await client.listPrompts()
                    result.prompts = prompts.prompts
                } catch (error) {
                    console.error(`MCP服务器${name}中不存在propmts`)
                }
                try {
                    const resources = await client.listResources()
                    result.resources = resources.resources
                } catch (error) {
                    console.error(`MCP服务器${name}中不存在resources`)
                }
                mcps.push(result)
                this.clientList.push(client)
            } catch (err) {
                console.error(`Error connecting to MCP server ${name}:`, err)
                result.isError = true
                mcps.push(result)
                continue
            }
        }

        this.cache = mcps
        this.dirty = false
        return mcps
    }

    /** 获取单个 MCP */
    public async get(name: string): Promise<IMCPItem | undefined> {
        const all = await this.loadAll()
        return all.find(m => m.id === name)
    }

    public async closeAllClient() {
        for (const item of this.clientList) {
            await item?.close()
        }
    }
}

/** 默认导出单例 */
export default MCPManager.getInstance()