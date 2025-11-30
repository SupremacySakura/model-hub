import { ApiResponse } from "../../type/api"
import { IHistoryItem } from "../../type/message"

/**
 * 获取历史记录列表
 * @async
 * @returns {Promise<ApiResponse<IHistoryItem[]>>} 历史记录列表响应
 */
export const getHistory = async (): Promise<ApiResponse<IHistoryItem[]>> => {
    const response = await fetch('http://localhost:11435/api/history')
    const data = await response.json()
    return data
}

/**
 * 添加历史记录
 * @async
 * @param {string} sessionId - 会话ID
 * @returns {Promise<ApiResponse<null>>} 添加历史记录响应
 */
export const addHistory = async (sessionId: string): Promise<ApiResponse<null>> => {
    const response = await fetch('http://localhost:11435/api/history/add', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
    })
    const data = await response.json()
    return data
}

/**
 * 删除单条历史记录
 * @async
 * @param {string} sessionId - 会话ID
 * @returns {Promise<ApiResponse<null>>} 删除历史记录响应
 */
export const deleteSingleHistory = async (sessionId: string): Promise<ApiResponse<null>> => {
    const response = await fetch('http://localhost:11435/api/history/single', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId })
    })
    const data = await response.json()
    return data
}

/**
 * 删除所有历史记录
 * @async
 * @returns {Promise<ApiResponse<null>>} 删除所有历史记录响应
 */
export const deleteAllHistory = async (): Promise<ApiResponse<null>> => {
    const response = await fetch('http://localhost:11435/api/history/all', {
        method: 'DELETE'
    })
    const data = await response.json()
    return data
}