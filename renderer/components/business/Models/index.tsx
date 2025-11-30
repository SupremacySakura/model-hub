'use client'

import { Button, Input, message, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { IModelItem } from "../../../type/model"
import JsonConfigEditor from "../../ui/JsonConfigEditor"
import { getModelsConfig, updateModelsConfig, loadModels } from "../../../services"

export default function Models() {
    // messageApi
    const [messageApi, contextHolder] = message.useMessage()
    // 模型列表
    const [models, setModels] = useState<IModelItem[]>([])
    // 模型配置
    const [modelConfig, setModelConfig] = useState<string>('')
    // 是否在加载中
    const [loading, setLoading] = useState(false)
    // 搜索框
    const [search, setSearch] = useState('')
    // 是否编辑
    const [isEdit, setIsEdit] = useState(false)
    // 是否在保存中
    const [saving, setSaving] = useState<boolean>(false)
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
                setModelConfig(typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2))
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
     * 进入编辑模式
     * 
     * 设置isEdit状态为true，切换到配置编辑界面
     * 
     * @returns {void}
     */
    const handleEditConfig = () => {
        setIsEdit(true)
    }

    /**
     * 保存模型配置
     * 
     * 通过HTTP调用保存模型配置，并更新模型列表和配置
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        try {
            setSaving(true)
            const data = await updateModelsConfig(modelConfig)
            if (data.code === 200) {
                messageApi.success("配置已保存")
                setIsEdit(false)
                handleGetModelsConfig()
                handleLoadModels()
            } else {
                messageApi.error(data.message || "保存失败")
            }
        } catch (error) {
            console.error("保存配置失败:", error)
            messageApi.error("保存失败")
        } finally {
            setSaving(false)
        }
    }

    // 初始化
    useEffect(() => {
        handleLoadModels()
        handleGetModelsConfig()
    }, [])

    return (
        <div className="h-full bg-gray-50 p-6 overflow-hidden">
            {contextHolder}
            {isEdit ? (
                <section className="mx-auto max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">编辑模式</div>
                            <h3 className="text-xl font-semibold text-gray-900 mt-1">JSON 配置</h3>
                            <p className="text-sm text-gray-500">仅在确认内容正确后再保存</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEdit(false)}>取消</Button>
                            <Button type="primary" loading={saving} onClick={handleSave}>
                                保存配置
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-900/95">
                        <JsonConfigEditor value={modelConfig} onChange={setModelConfig} />
                    </div>
                </section>
            ) : (
                <section className="mx-auto max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-blue-500">模型管理</div>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-1">模型列表</h2>
                            <p className="text-sm text-gray-500">管理你已配置的所有模型</p>
                        </div>
                        <Button type="primary" size="large" onClick={handleEditConfig}>
                            编辑配置
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between text-sm text-gray-500">
                        <span>共 {filteredModels.length} 个模型</span>
                    </div>

                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 h-40 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Spin />
                            </div>
                        ) : filteredModels.length === 0 ? (
                            <div className="text-center text-gray-400 py-16">
                                暂无模型，点击右上角添加
                            </div>
                        ) : (
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
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}