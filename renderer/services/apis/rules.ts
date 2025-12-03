import { ApiResponse } from "../../type/api"
import { IRule } from "../../type/rules"

export const loadRules = async (): Promise<ApiResponse<IRule[]>> => {
    const response = await fetch('http://localhost:11435/api/rules')
    const data = await response.json()
    return data
}

export const addRule = async (rule: IRule): Promise<ApiResponse<string>> => {
    const response = await fetch('http://localhost:11435/api/rules/add', {
        method: 'POST',
        body: JSON.stringify(rule),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const data = await response.json()
    return data
}

export const deleteRule = async (id: string): Promise<ApiResponse<string>> => {
    const response = await fetch('http://localhost:11435/api/rules/single', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const data = await response.json()
    return data
}