import { ApiResponse } from "../../type/api"
import { IMCPItem } from "../../type/MCP"

/**
 * 获取MCP配置
 * @async
 * @returns {Promise<ApiResponse<string>>} MCP配置响应
 */
export const getMCPConfig = async (): Promise<ApiResponse<string>> => {
    const response = await fetch('http://localhost:11435/api/mcp', {
        method: 'GET'
    })
    const result = await response.json()
    return result
}

/**
 * 更新MCP配置
 * @async
 * @param {string} config - MCP配置内容
 * @returns {Promise<ApiResponse<null>>} 更新MCP配置响应
 */
export const updateMCPConfig = async (config: string): Promise<ApiResponse<null>> => {
    const response = await fetch('http://localhost:11435/api/mcp/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            config
        })
    })
    const result = await response.json()
    return result
}

/**
 * 加载MCP列表
 * @async
 * @returns {Promise<ApiResponse<IMCPItem[]>>} MCP列表响应
 */
export const loadMCPs = async (): Promise<ApiResponse<IMCPItem[]>> => {
    const response = await fetch('http://localhost:11435/api/mcp/load', {
        method: 'GET'
    })
    const result = await response.json()
    return result
}