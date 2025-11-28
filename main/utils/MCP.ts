import { Client } from '@modelcontextprotocol/sdk/client'
import { StdioClientTransport, StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js"
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { IMCPItem } from '../../renderer/type/MCP'

interface IMCPConfig {
    mcpServers: Record<string, StdioServerParameters>
}

/**
 * 获取MCP配置
 * 
 * 从持久化存储中读取MCP配置，如果配置文件不存在则初始化一个默认配置
 * 
 * @async
 * @returns {Promise<string>} JSON格式的MCP配置字符串
 * @throws {Error} 读取或写入文件时可能抛出错误
 */
export const getMCPConfig = async () => {
    // 获取持久化存储路径
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config")

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, "mcp.json")
    const initMCPConfog = JSON.stringify({ mcpServers: {} }, null, 2)

    try {
        // 不存在则初始化
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, initMCPConfog, "utf-8")
            return initMCPConfog
        }

        // 读取 JSON
        const json = fs.readFileSync(filePath, "utf-8")
        return json

    } catch (error) {
        console.error("Error reading models.json:", error)
        return initMCPConfog
    }
}

/**
 * 更新MCP配置
 * 
 * 将传入的MCP配置写入到持久化存储中
 * 
 * @async
 * @param {string} config - 要写入的MCP配置字符串
 * @returns {Promise<void>}
 * @throws {Error} 写入文件时可能抛出错误
 */
export const updateMCPConfig = async (config: string) => {
    // 获取持久化存储路径
    const userDataPath = app.getPath("userData")
    const configDir = path.join(userDataPath, "config")

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
    }

    const filePath = path.join(configDir, "mcp.json")

    try {
        // 将配置写入文件
        fs.writeFileSync(filePath, config, "utf-8")
    } catch (error) {
        console.error("Error writing mcp.json:", error)
        throw error
    }
}
/**
 * 加载MCP服务器
 * 
 * 从配置中加载所有MCP服务器实例
 * 
 * @async
 * @returns {Promise<IMCPItem[]>} 包含所有MCP服务器信息的数组
 * @throws {Error} 连接MCP服务器时可能抛出错误
 */
export const loadMCP = async () => {
    const mcps: IMCPItem[] = []
    const json = await getMCPConfig()
    const config = JSON.parse(json) as IMCPConfig
    const mcpServers = config.mcpServers
    for (const name in mcpServers) {
        try {
            const mcpServer = mcpServers[name]
            const transport = new StdioClientTransport(mcpServer)
            const cilent = new Client({
                name,
                version: '1.0.0'
            })
            await cilent.connect(transport)
            const newMcp: IMCPItem = {
                id: name,
                tools: [],
                prompts: [],
                client: cilent
            }
            const tools = await cilent.listTools()
            newMcp.tools = tools.tools
            const prompts = await cilent.listPrompts()
            newMcp.prompts = prompts.prompts
            mcps.push(newMcp)
        } catch (error) {

        }
    }
    return mcps
}