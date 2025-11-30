import { ApiResponse } from "../../type/api"
import { IModelItem } from "../../type/model"

/**
 * 获取模型配置
 * @async
 * @returns {Promise<ApiResponse<string>>} 模型配置响应
 */
export const getModelsConfig = async (): Promise<ApiResponse<string>> => {
    const response = await fetch('http://localhost:11435/api/models', {
        method: 'GET'
    })
    const result = await response.json()
    return result
}

/**
 * 更新模型配置
 * @async
 * @param {string} config - 模型配置内容
 * @returns {Promise<ApiResponse<null>>} 更新模型配置响应
 */
export const updateModelsConfig = async (config: string): Promise<ApiResponse<null>> => {
    const response = await fetch('http://localhost:11435/api/models/update', {
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
 * 加载模型列表
 * @async
 * @returns {Promise<ApiResponse<IModelItem[]>>} 模型列表响应
 */
export const loadModels = async (): Promise<ApiResponse<IModelItem[]>> => {
    const response = await fetch('http://localhost:11435/api/models/load', {
        method: 'GET'
    })
    const result = await response.json()
    return result
}