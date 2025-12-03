'use client'

import { Button, Input, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { IModelItem } from "../../../type/model"
import { getModelsConfig, updateModelsConfig, loadModels } from "../../../services"
import SettingLayout from "../../ui/SettingLayout"

export default function Models() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 模型列表
    const [models, setModels] = useState<IModelItem[]>([])
    // 模型配置
    const [config, setConfig] = useState<string>('')
    // 是否在加载中
    const [loading, setLoading] = useState(false)
    // 搜索框
    const [search, setSearch] = useState('')

    /**
     * 通过HTTP调用获取所有可用的模型列表，并更新模型状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleLoadModels = async () => {
        try {
            setLoading(true)
            const data = await loadModels()
            if (data.code === 200) {
                setModels(data.data)
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * 通过HTTP调用获取模型配置，并确保配置为字符串类型
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleGetModelsConfig = async () => {
        try {
            const data = await getModelsConfig()
            if (data.code === 200) {
                setConfig(typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2))
            }
        } finally {
        }
    }

    /**
     * 根据搜索关键词过滤模型列表
     * 
     * 使用useMemo缓存过滤结果，仅当models或search变化时重新计算
     * 
     * @returns {IModelItem[]} 过滤后的模型列表
     */
    const filteredModels = useMemo(() => {
        if (!search.trim()) return models
        return models.filter((model) =>
            [model.name, model.provider].some((field) =>
                field.toLowerCase().includes(search.toLowerCase())
            )
        )
    }, [models, search])

    /**
     * 保存模型配置
     * 
     * 通过HTTP调用保存模型配置，并更新模型列表和配置
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveConfig = async (config: string) => {
        try {
            const data = await updateModelsConfig(config)
            if (data.code === 200) {
                messageApi.success("配置已保存")
                handleGetModelsConfig()
                handleLoadModels()
            } else {
                messageApi.error(data.message || "保存失败")
            }
        } catch (error) {
            console.error("保存配置失败:", error)
            messageApi.error("保存失败")
        }
    }

    // 初始化
    useEffect(() => {
        handleLoadModels()
        handleGetModelsConfig()
    }, [])

    const getMiddleComponent = () => {
        return (
            <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-shrink-0">
                    <Input
                        placeholder="搜索模型名称或提供商"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                        allowClear
                    />
                    <Button
                        type="primary"
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => setSearch((prev) => prev.trim())}
                    >
                        搜索
                    </Button>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between text-sm text-gray-500 flex-shrink-0">
                    <span>共 {filteredModels.length} 个模型</span>
                </div>
            </>
        )
    }

    const getMainComponent = () => {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 overflow-hidden flex-1 min-h-0 flex flex-col">
                {contextHolder}
                {filteredModels.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        暂无模型，点击右上角添加
                    </div>
                ) : (
                    <div className="overflow-y-auto p-4 h-full">
                        <ul className="grid gap-4 md:grid-cols-2">
                            {filteredModels.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex flex-col gap-2 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="text-base font-medium text-gray-900">{item.name}</div>
                                        <span className="text-xs text-gray-400">ID: {item.id}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">提供商：{item.provider || '-'}</div>
                                    <div className="text-sm text-gray-500 truncate">
                                        Base URL：{item.baseURL || '未设置'}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    return (
        <SettingLayout label="模型管理" title="模型列表" description="管理你已配置的所有模型" isEditButtonShow={true} MainComponent={getMainComponent()} MiddleComponent={getMiddleComponent()} loading={loading} config={config} handleSaveConfig={handleSaveConfig}></SettingLayout>
    )
}
