'use client'

import { Button, Input, Modal, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { IModelItem } from "../../type/model"

export default function Models() {
    // 模型列表
    const [models, setModels] = useState<IModelItem[]>([])
    // 添加弹窗
    const [isModalOpen, setIsModalOpen] = useState(false)
    // 是否在加载中
    const [loading, setLoading] = useState(false)
    // 搜索框
    const [search, setSearch] = useState('')
    // 添加模型
    const [newModel, setNewModel] = useState<IModelItem>({
        id: '',
        name: '',
        provider: '',
        apiKey: '',
        baseURL: '',
    })
    // 是否正在提交
    const [submitting, setSubmitting] = useState(false)

    /**
     * 从主进程获取模型列表
     * 
     * 通过IPC调用获取所有可用的模型列表，并更新模型状态
     * 
     * @async
     * @returns {Promise<void>}
     */
    const fetchModels = async () => {
        try {
            setLoading(true)
            const data = await window.llm.getModels()
            if (data.code === 200) {
                setModels(data.data.models)
            }
        } finally {
            setLoading(false)
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

    // 初始化
    useEffect(() => {
        fetchModels()
    }, [])

    /**
     * 打开添加模型模态框
     * 
     * 设置isModalOpen为true，显示添加模型的模态对话框
     * 
     * @returns {void}
     */
    const handleModalOpen = () => setIsModalOpen(true)

    /**
     * 关闭添加模型模态框
     * 
     * 设置isModalOpen为false，隐藏添加模型的模态对话框，并重置新模型的状态
     * 
     * @returns {void}
     */
    const handleModalClose = () => {
        setIsModalOpen(false)
        setNewModel({
            id: '',
            name: '',
            provider: '',
            apiKey: '',
            baseURL: '',
        })
    }

    /**
     * 更新新模型的属性值
     * 
     * 根据指定的键和值更新新模型对象的对应属性
     * 
     * @param {keyof IModelItem} key - 要更新的模型属性键
     * @param {string} value - 要设置的属性值
     * @returns {void}
     */
    const handleChange = (key: keyof IModelItem, value: string) => {
        setNewModel((prev) => ({ ...prev, [key]: value }))
    }

    /**
     * 添加新模型
     * 
     * 验证新模型的必填字段，然后通过IPC调用将新模型添加到持久化存储中
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleAddModel = async () => {
        if (!newModel.id || !newModel.name) {
            return
        }
        try {
            setSubmitting(true)
            const data = await window.llm.addModel(newModel)
            if (data.code === 200) {
                setModels((prev) => [...prev, data.data])
                handleModalClose()
            }
        } finally {
            setSubmitting(false)
        }
    }

    /**
     * 删除指定模型
     * 
     * 通过IPC调用删除指定的模型，并重新获取模型列表以更新界面
     * 
     * @async
     * @param {IModelItem} model - 要删除的模型对象
     * @returns {Promise<void>}
     */
    const handleDeleteModel = async (model: IModelItem) => {
        try {
            const data = await window.llm.deleteModel(model)
            if (data.code === 200) {
                fetchModels()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
            <section className="flex flex-col gap-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
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
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        共 {filteredModels.length} 个模型
                    </div>
                    <Button type="primary" onClick={handleModalOpen}>
                        添加模型
                    </Button>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[300px] overflow-y-auto">
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
                                className="flex flex-col gap-2 p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-base font-medium text-gray-900">{item.name}</div>
                                    <span className="text-xs text-gray-400">ID: {item.id}</span>
                                </div>
                                <div className="text-sm text-gray-600">提供商：{item.provider || '-'}</div>
                                <div className="text-sm text-gray-500 truncate">
                                    Base URL：{item.baseURL || '未设置'}
                                </div>
                                <Button danger onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteModel(item)
                                }}>删除</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Modal
                title="添加模型"
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                centered
            >
                <div className="space-y-4">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">ID</div>
                        <Input value={newModel.id} onChange={(e) => handleChange('id', e.target.value)} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-1">名称</div>
                        <Input value={newModel.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-1">提供商</div>
                        <Input value={newModel.provider} onChange={(e) => handleChange('provider', e.target.value)} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-1">API Key</div>
                        <Input.Password value={newModel.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Base URL</div>
                        <Input value={newModel.baseURL} onChange={(e) => handleChange('baseURL', e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleModalClose}>取消</Button>
                        <Button type="primary" loading={submitting} onClick={handleAddModel}>
                            添加
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}