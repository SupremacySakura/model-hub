'use client'
import { Button, Input, Modal, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { IModelItem } from "../../type/model"

export default function Models() {
    const [models, setModels] = useState<IModelItem[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [newModel, setNewModel] = useState<IModelItem>({
        id: '',
        name: '',
        provider: '',
        apiKey: '',
        baseURL: '',
    })
    const [submitting, setSubmitting] = useState(false)

    const filteredModels = useMemo(() => {
        if (!search.trim()) return models
        return models.filter((model) =>
            [model.name, model.provider].some((field) =>
                field.toLowerCase().includes(search.toLowerCase())
            )
        )
    }, [models, search])

    useEffect(() => {
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
        fetchModels()
    }, [])

    const handleModalOpen = () => setIsModalOpen(true)
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

    const handleChange = (key: keyof IModelItem, value: string) => {
        setNewModel((prev) => ({ ...prev, [key]: value }))
    }

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

    return (
        <div className="flex flex-col gap-6 p-6">
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

            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[300px]">
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